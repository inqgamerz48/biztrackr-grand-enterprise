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
        // Fetch all categories for tenant
        const categories = await prisma.category.findMany({
            where: { tenant_id: tenantId }
        });

        const results = [];
        for (const cat of categories) {
            // Aggregate sales total for items in this category
            const totalAgg = await prisma.saleItem.aggregate({
                where: {
                    sale: {
                        tenant_id: tenantId
                    },
                    item: {
                        category_id: cat.id
                    }
                },
                _sum: {
                    total: true
                }
            });

            const totalSales = totalAgg._sum.total || 0.0;
            if (totalSales > 0) {
                results.push({
                    name: cat.name || 'Unknown',
                    value: totalSales
                });
            }
        }

        return res.status(200).json(results);
    } catch (err: any) {
        console.error('GET CATEGORY DISTRIBUTION ERROR:', err);
        return res.status(500).json({ detail: 'Failed to fetch category sales distribution' });
    }
};

export default withAuth(handler);
