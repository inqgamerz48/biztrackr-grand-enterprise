import { NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { AuthenticatedRequest, withAuth } from '@/lib/api-middleware';

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const tenantId = req.user.tenant_id;

    if (!tenantId) {
        return res.status(400).json({ detail: 'User has no active tenant workspace' });
    }

    if (req.method === 'GET') {
        const category = req.query.category as string;
        const startDate = req.query.start_date as string;
        const endDate = req.query.end_date as string;
        const skip = parseInt(req.query.skip as string) || 0;
        const limit = parseInt(req.query.limit as string) || 100;

        const whereClause: any = { tenant_id: tenantId };
        if (category) {
            whereClause.category = category;
        }
        if (startDate || endDate) {
            whereClause.date = {};
            if (startDate) whereClause.date.gte = new Date(startDate);
            if (endDate) whereClause.date.lte = new Date(endDate);
        }

        try {
            const expenses = await prisma.expense.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy: { date: 'desc' }
            });

            const formatted = expenses.map(exp => ({
                id: exp.id,
                category: exp.category,
                amount: exp.amount,
                description: exp.description,
                date: exp.date.toISOString(),
                created_at: exp.created_at?.toISOString()
            }));

            return res.status(200).json(formatted);
        } catch (err: any) {
            console.error('GET EXPENSES ERROR:', err);
            return res.status(500).json({ detail: 'Failed to fetch expenses list' });
        }
    }

    if (req.method === 'POST') {
        try {
            const { category, amount, description, date } = req.body;

            if (!category || amount === undefined || !date) {
                return res.status(400).json({ detail: 'Category, Amount, and Date are required' });
            }

            const newExpense = await prisma.expense.create({
                data: {
                    category,
                    amount: Number(amount),
                    description: description || null,
                    date: new Date(date),
                    tenant_id: tenantId
                }
            });

            return res.status(201).json({
                id: newExpense.id,
                category: newExpense.category,
                amount: newExpense.amount,
                description: newExpense.description,
                date: newExpense.date.toISOString()
            });
        } catch (err: any) {
            console.error('CREATE EXPENSE ERROR:', err);
            return res.status(500).json({ detail: 'Failed to create expense' });
        }
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ detail: `Method ${req.method} not allowed` });
};

export default withAuth(handler);
