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
        const startDateParam = req.query.start_date as string;
        const endDateParam = req.query.end_date as string;

        const endDate = endDateParam ? new Date(endDateParam) : new Date();
        const startDate = startDateParam ? new Date(startDateParam) : new Date();
        if (!startDateParam) {
            startDate.setDate(endDate.getDate() - 30);
        }

        const groups = await prisma.expense.groupBy({
            by: ['category'],
            where: {
                tenant_id: tenantId,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            _sum: {
                amount: true
            }
        });

        const formatted = groups.map((g: any) => ({
            name: g.category,
            value: g._sum.amount || 0.0
        }));

        return res.status(200).json(formatted);
    } catch (err: any) {
        console.error('GET EXPENSES BY CATEGORY ANALYTICS ERROR:', err);
        return res.status(500).json({ detail: 'Failed to fetch expenses by category analytics' });
    }
};

export default withAuth(handler);
