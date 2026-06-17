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
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const sales = await prisma.sale.findMany({
            where: {
                tenant_id: tenantId,
                date: {
                    gte: startDate
                }
            },
            select: {
                date: true,
                total_amount: true
            }
        });

        // Group by Date (YYYY-MM-DD)
        const groups: { [key: string]: number } = {};
        for (const sale of sales) {
            if (sale.date) {
                const dateStr = sale.date.toISOString().split('T')[0];
                groups[dateStr] = (groups[dateStr] || 0.0) + (sale.total_amount || 0.0);
            }
        }

        const sorted = Object.keys(groups)
            .sort()
            .map(date => ({
                date,
                total: groups[date]
            }));

        return res.status(200).json(sorted);
    } catch (err: any) {
        console.error('GET SALES OVER TIME ERROR:', err);
        return res.status(500).json({ detail: 'Failed to fetch sales over time reports' });
    }
};

export default withAuth(handler);
