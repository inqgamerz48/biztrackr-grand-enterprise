import { NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { AuthenticatedRequest, withAuth } from '@/lib/api-middleware';
import { logAction } from '@/lib/services';

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;

    if (!tenantId) {
        return res.status(400).json({ detail: 'User has no active tenant workspace' });
    }

    if (req.method === 'GET') {
        const skip = parseInt(req.query.skip as string) || 0;
        const limit = parseInt(req.query.limit as string) || 100;

        try {
            const items = await prisma.inventoryItem.findMany({
                where: { tenant_id: tenantId },
                include: {
                    category: true,
                    supplier: true,
                    branch: true
                },
                skip,
                take: limit,
                orderBy: { id: 'desc' }
            });
            return res.status(200).json(items);
        } catch (err: any) {
            console.error('FETCH INVENTORY ERROR:', err);
            return res.status(500).json({ detail: 'Failed to fetch inventory items' });
        }
    }

    if (req.method === 'POST') {
        // Only allow admins and managers to write
        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            return res.status(403).json({ detail: 'Access denied. Managers or Admin only.' });
        }

        try {
            const {
                name,
                barcode,
                quantity,
                min_stock,
                mrp,
                purchase_price,
                selling_price,
                tax_rate,
                image_url,
                category_id,
                branch_id,
                supplier_id
            } = req.body;

            // Check Plan limits
            const tenant = await prisma.tenant.findUnique({
                where: { id: tenantId }
            });

            const plan = tenant?.plan || 'free';
            if (plan === 'free') {
                const count = await prisma.inventoryItem.count({
                    where: { tenant_id: tenantId }
                });
                if (count >= 100) {
                    return res.status(403).json({
                        detail: "Item limit reached for your 'free' plan. Please upgrade to add more items."
                    });
                }
            }

            // Generate barcode if not present
            let finalBarcode = barcode;
            if (!finalBarcode) {
                const timestamp = Math.floor(Date.now() / 1000);
                const randSuffix = Math.floor(1000 + Math.random() * 9000);
                finalBarcode = `ITM-${timestamp}-${randSuffix}`;
            }

            const newItem = await prisma.inventoryItem.create({
                data: {
                    name,
                    barcode: finalBarcode,
                    quantity: quantity !== undefined ? Number(quantity) : 0,
                    min_stock: min_stock !== undefined ? Number(min_stock) : 5,
                    mrp: mrp !== undefined ? Number(mrp) : null,
                    purchase_price: purchase_price !== undefined ? Number(purchase_price) : 0.0,
                    selling_price: selling_price !== undefined ? Number(selling_price) : 0.0,
                    tax_rate: tax_rate !== undefined ? Number(tax_rate) : null,
                    image_url: image_url || null,
                    category_id: category_id ? Number(category_id) : null,
                    branch_id: branch_id ? Number(branch_id) : null,
                    supplier_id: supplier_id ? Number(supplier_id) : null,
                    tenant_id: tenantId
                },
                include: {
                    category: true,
                    supplier: true,
                    branch: true
                }
            });

            await logAction(tenantId, userId, "CREATE_ITEM", "item", newItem.id, {
                name: newItem.name,
                quantity: newItem.quantity
            });

            return res.status(201).json(newItem);
        } catch (err: any) {
            console.error('CREATE INVENTORY ITEM ERROR:', err);
            return res.status(500).json({ detail: 'Failed to create inventory item' });
        }
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ detail: `Method ${req.method} not allowed` });
};

export default withAuth(handler);
