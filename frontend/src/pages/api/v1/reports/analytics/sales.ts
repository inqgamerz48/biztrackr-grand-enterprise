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
        const days = parseInt(req.query.days as string) || 30;
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);

        const sales = await prisma.sale.findMany({
            where: {
                tenant_id: tenantId,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            select: {
                date: true,
                total_amount: true
            }
        });

        // Group in memory
        const dailyGroups: { [key: string]: { total: number, count: number } } = {};
        for (const sale of sales) {
            if (sale.date) {
                const dateStr = sale.date.toISOString().split('T')[0];
                if (!dailyGroups[dateStr]) {
                    dailyGroups[dateStr] = { total: 0.0, count: 0 };
                }
                dailyGroups[dateStr].total += sale.total_amount || 0.0;
                dailyGroups[dateStr].count += 1;
            }
        }

        const formatted = Object.keys(dailyGroups)
            .sort()
            .map(date => ({
                date,
                total: dailyGroups[date].total,
                count: dailyGroups[date].count
            }));

        return res.status(200).json({
            daily_sales: formatted
        });
    } catch (err: any) {
        console.error('GET SALES ANALYTICS ERROR:', err);
        return res.status(500).json({ detail: 'Failed to fetch sales analytics' });
    }
};

export default withAuth(handler);
