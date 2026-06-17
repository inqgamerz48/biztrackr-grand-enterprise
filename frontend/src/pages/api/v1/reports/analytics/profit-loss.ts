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

        // Total Revenue (Sales)
        const salesAggregation = await prisma.sale.aggregate({
            where: {
                tenant_id: tenantId,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            _sum: {
                total_amount: true
            }
        });
        const revenue = salesAggregation._sum.total_amount || 0.0;

        // Cost of Goods Sold (Purchases)
        const purchasesAggregation = await prisma.purchase.aggregate({
            where: {
                tenant_id: tenantId,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            _sum: {
                total_amount: true
            }
        });
        const cogs = purchasesAggregation._sum.total_amount || 0.0;

        // Expenses
        const expensesAggregation = await prisma.expense.aggregate({
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
        const expenses = expensesAggregation._sum.amount || 0.0;

        const grossProfit = revenue - cogs;
        const netProfit = grossProfit - expenses;

        return res.status(200).json({
            revenue,
            cost_of_goods_sold: cogs,
            gross_profit: grossProfit,
            operating_expenses: expenses,
            net_profit: netProfit,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString()
        });
    } catch (err: any) {
        console.error('GET PROFIT LOSS ERROR:', err);
        return res.status(500).json({ detail: 'Failed to fetch profit & loss analytics' });
    }
};

export default withAuth(handler);
