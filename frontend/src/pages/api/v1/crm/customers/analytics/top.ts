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
        const limit = parseInt(req.query.limit as string) || 10;

        // Fetch top customers by total sales volume using prisma group by / aggregations
        const topSales = await prisma.sale.groupBy({
            by: ['customer_id'],
            where: {
                tenant_id: tenantId,
                customer_id: { not: null }
            },
            _count: {
                id: true
            },
            _sum: {
                total_amount: true
            },
            orderBy: {
                _sum: {
                    total_amount: 'desc'
                }
            },
            take: limit
        });

        const results = [];
        for (const record of topSales) {
            const customer = await prisma.customer.findUnique({
                where: { id: record.customer_id! }
            });

            if (customer) {
                results.push({
                    id: customer.id,
                    name: customer.name || 'Unknown',
                    phone: customer.phone || 'N/A',
                    transaction_count: record._count.id,
                    total_sales: record._sum.total_amount || 0.0
                });
            }
        }

        return res.status(200).json(results);
    } catch (err: any) {
        console.error('FETCH TOP CUSTOMERS ERROR:', err);
        return res.status(500).json({ detail: 'Failed to fetch top customers' });
    }
};

export default withAuth(handler);
