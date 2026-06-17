import { NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { AuthenticatedRequest, withAuth } from '@/lib/api-middleware';

export const config = {
    api: {
        bodyParser: false,
    },
};

function getRawBody(req: AuthenticatedRequest): Promise<string> {
    return new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => {
            data += chunk;
        });
        req.on('end', () => {
            resolve(data);
        });
        req.on('error', err => {
            reject(err);
        });
    });
}

function parseMultipartCSV(bodyText: string, boundary: string): string {
    const parts = bodyText.split(boundary);
    for (const part of parts) {
        if (part.includes('name="file"')) {
            const headerEndIndex = part.indexOf('\r\n\r\n');
            if (headerEndIndex !== -1) {
                let content = part.substring(headerEndIndex + 4);
                const lastLineIndex = content.lastIndexOf('\r\n--');
                if (lastLineIndex !== -1) {
                    content = content.substring(0, lastLineIndex);
                } else {
                    const lastLineIndex2 = content.lastIndexOf('\n--');
                    if (lastLineIndex2 !== -1) {
                        content = content.substring(0, lastLineIndex2);
                    }
                }
                return content.trim();
            }
        }
    }
    return '';
}

function parseCSV(csvText: string): string[][] {
    const lines = csvText.split(/\r?\n/);
    return lines
        .map(line => {
            const result = [];
            let current = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    result.push(current);
                    current = '';
                } else {
                    current += char;
                }
            }
            result.push(current);
            return result.map(s => s.trim().replace(/^"|"$/g, ''));
        })
        .filter(row => row.length > 0 && row[0] !== '');
}

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const tenantId = req.user.tenant_id;
    if (!tenantId) {
        return res.status(400).json({ detail: 'User has no active tenant workspace' });
    }

    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ detail: `Method ${req.method} not allowed` });
    }

    try {
        const contentType = req.headers['content-type'] || '';
        const boundaryMatch = contentType.match(/boundary=(.+)/);
        if (!boundaryMatch) {
            return res.status(400).json({ detail: 'Content-Type must be multipart/form-data with a boundary' });
        }

        const boundary = `--${boundaryMatch[1]}`;
        const rawBody = await getRawBody(req);
        const csvContent = parseMultipartCSV(rawBody, boundary);

        if (!csvContent) {
            return res.status(400).json({ detail: 'Could not extract CSV file content from the upload' });
        }

        const rows = parseCSV(csvContent);
        if (rows.length < 2) {
            return res.status(400).json({ detail: 'CSV file must contain a header and at least one data row' });
        }

        const headers = rows[0].map(h => h.toLowerCase());
        const nameIdx = headers.indexOf('name');
        const quantityIdx = headers.indexOf('quantity');
        const sellingPriceIdx = headers.indexOf('selling_price');
        const purchasePriceIdx = headers.indexOf('purchase_price');
        const categoryIdx = headers.indexOf('category');
        const minStockIdx = headers.indexOf('min_stock');

        if (nameIdx === -1 || quantityIdx === -1 || sellingPriceIdx === -1) {
            return res.status(400).json({
                detail: 'Missing required columns. CSV must have name, quantity, and selling_price'
            });
        }

        let itemsCreated = 0;
        let categoriesCreated = 0;
        const errors: any[] = [];
        const categoryCache = new Map<string, number>();

        // Get existing categories to populate cache
        const existingCats = await prisma.category.findMany({
            where: { tenant_id: tenantId }
        });
        for (const cat of existingCats) {
            if (cat.name) {
                categoryCache.set(cat.name.toLowerCase(), cat.id);
            }
        }

        // Process rows (skip header)
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.length < 3) continue; // Skip malformed short lines

            try {
                const name = row[nameIdx];
                const qtyVal = parseInt(row[quantityIdx]) || 0;
                const sellingVal = parseFloat(row[sellingPriceIdx]) || 0.0;
                const purchaseVal = purchasePriceIdx !== -1 ? parseFloat(row[purchasePriceIdx]) || 0.0 : 0.0;
                const minStockVal = minStockIdx !== -1 ? parseInt(row[minStockIdx]) || 5 : 5;
                const categoryName = categoryIdx !== -1 ? row[categoryIdx]?.trim() : '';

                if (!name) {
                    throw new Error('Name column is empty');
                }

                let categoryId: number | null = null;
                if (categoryName) {
                    const catKey = categoryName.toLowerCase();
                    if (!categoryCache.has(catKey)) {
                        const newCat = await prisma.category.create({
                            data: {
                                name: categoryName,
                                tenant_id: tenantId
                            }
                        });
                        categoryCache.set(catKey, newCat.id);
                        categoriesCreated++;
                    }
                    categoryId = categoryCache.get(catKey)!;
                }

                // Create item barcode
                const timestamp = Math.floor(Date.now() / 1000);
                const randSuffix = Math.floor(1000 + Math.random() * 9000);
                const barcode = `ITM-${timestamp}-${randSuffix}`;

                await prisma.inventoryItem.create({
                    data: {
                        name,
                        barcode,
                        quantity: qtyVal,
                        selling_price: sellingVal,
                        purchase_price: purchaseVal,
                        min_stock: minStockVal,
                        category_id: categoryId,
                        tenant_id: tenantId
                    }
                });

                itemsCreated++;
            } catch (err: any) {
                errors.push({
                    row: i + 1,
                    error: err.message || 'Unknown error parsing row',
                    data: row
                });
            }
        }

        return res.status(200).json({
            items_created: itemsCreated,
            categories_created: categoriesCreated,
            total_rows: rows.length - 1,
            errors
        });
    } catch (err: any) {
        console.error('BULK IMPORT ERROR:', err);
        return res.status(500).json({ detail: `Bulk import failed: ${err.message}` });
    }
};

export default withAuth(handler);
