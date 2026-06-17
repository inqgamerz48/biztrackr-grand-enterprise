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
        const startDate = req.query.start_date as string;
        const endDate = req.query.end_date as string;

        const whereClause: any = { tenant_id: tenantId };
        if (startDate || endDate) {
            whereClause.date = {};
            if (startDate) whereClause.date.gte = new Date(startDate);
            if (endDate) whereClause.date.lte = new Date(endDate);
        }

        const totalAggregation = await prisma.expense.aggregate({
            where: whereClause,
            _sum: {
                amount: true
            }
        });

        const total = totalAggregation._sum.amount || 0.0;
        return res.status(200).json({ total });
    } catch (err: any) {
        console.error('GET TOTAL EXPENSES ERROR:', err);
        return res.status(500).json({ detail: 'Failed to fetch total expenses' });
    }
};

export default withAuth(handler);
