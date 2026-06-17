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
        const categories = await prisma.category.findMany({
            where: { tenant_id: tenantId }
        });

        const results = [];
        for (const cat of categories) {
            const items = await prisma.inventoryItem.findMany({
                where: { category_id: cat.id, tenant_id: tenantId },
                select: {
                    quantity: true,
                    selling_price: true
                }
            });

            const count = items.length;
            const value = items.reduce((sum: number, item: any) => sum + ((item.quantity || 0) * (item.selling_price || 0.0)), 0);

            if (count > 0) {
                results.push({
                    name: cat.name || 'Unknown',
                    count,
                    value
                });
            }
        }

        return res.status(200).json(results);
    } catch (err: any) {
        console.error('GET INVENTORY BY CATEGORY ERROR:', err);
        return res.status(500).json({ detail: 'Failed to fetch inventory distribution analytics' });
    }
};

export default withAuth(handler);
