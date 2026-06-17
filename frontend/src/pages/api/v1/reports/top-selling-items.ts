import { NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { AuthenticatedRequest, withAuth } from '@/lib/api-middleware';

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const tenantId = req.user.tenant_id;

    if (!tenantId) {
        return res.status(400).json({ detail: 'User has no active tenant workspace' });
    }

    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ detail: `Method ${req.method} not allowed` });
    }

    try {
        const limit = parseInt(req.query.limit as string) || 5;

        // Fetch top selling items by joining/aggregating
        const topSelling = await prisma.saleItem.groupBy({
            by: ['item_id'],
            where: {
                sale: {
                    tenant_id: tenantId
                },
                item_id: { not: null }
            },
            _sum: {
                quantity: true
            },
            orderBy: {
                _sum: {
                    quantity: 'desc'
                }
            },
            take: limit
        });

        const results = [];
        for (const itemRecord of topSelling) {
            const item = await prisma.inventoryItem.findUnique({
                where: { id: itemRecord.item_id! }
            });
            if (item) {
                results.push({
                    name: item.name || 'Unknown Item',
                    quantity: itemRecord._sum.quantity || 0
                });
            }
        }

        return res.status(200).json(results);
    } catch (err: any) {
        console.error('GET TOP SELLING ITEMS ERROR:', err);
        return res.status(500).json({ detail: 'Failed to fetch top selling items' });
    }
};

export default withAuth(handler);
