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
        const months = parseInt(req.query.months as string) || 6;
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - (months * 30));

        // In Prisma, grouping by month/year requires raw SQL query or fetch followed by processing.
        // Doing JS aggregation after fetch is fast, reliable, and completely database agnostic!
        const expenses = await prisma.expense.findMany({
            where: {
                tenant_id: tenantId,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            select: {
                date: true,
                amount: true
            }
        });

        // Group in memory
        const groups: { [key: string]: { year: number, month: number, total: number } } = {};
        for (const exp of expenses) {
            const d = new Date(exp.date);
            const year = d.getFullYear();
            const month = d.getMonth() + 1; // 1-indexed
            const key = `${year}-${month}`;

            if (!groups[key]) {
                groups[key] = { year, month, total: 0.0 };
            }
            groups[key].total += exp.amount;
        }

        const sortedTrend = Object.values(groups).sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.month - b.month;
        });

        return res.status(200).json(sortedTrend);
    } catch (err: any) {
        console.error('GET EXPENSES TREND ERROR:', err);
        return res.status(500).json({ detail: 'Failed to fetch monthly expense trend' });
    }
};

export default withAuth(handler);
