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

        // Group purchases by supplier_id
        const topPurchases = await prisma.purchase.groupBy({
            by: ['supplier_id'],
            where: {
                tenant_id: tenantId,
                supplier_id: { not: null }
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
        for (const record of topPurchases) {
            const supplier = await prisma.supplier.findUnique({
                where: { id: record.supplier_id! }
            });

            if (supplier) {
                results.push({
                    id: supplier.id,
                    name: supplier.name || 'Unknown',
                    phone: supplier.phone || 'N/A',
                    transaction_count: record._count.id,
                    total_purchases: record._sum.total_amount || 0.0
                });
            }
        }

        return res.status(200).json(results);
    } catch (err: any) {
        console.error('FETCH TOP SUPPLIERS ERROR:', err);
        return res.status(500).json({ detail: 'Failed to fetch top suppliers' });
    }
};

export default withAuth(handler);
