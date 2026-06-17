import { NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { AuthenticatedRequest, withAuth } from '@/lib/api-middleware';

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const tenantId = req.user.tenant_id;
    const { id } = req.query;

    if (!tenantId) {
        return res.status(400).json({ detail: 'User has no active tenant workspace' });
    }

    const expenseId = parseInt(id as string);
    if (isNaN(expenseId)) {
        return res.status(400).json({ detail: 'Invalid Expense ID' });
    }

    if (req.method === 'GET') {
        try {
            const expense = await prisma.expense.findFirst({
                where: { id: expenseId, tenant_id: tenantId }
            });

            if (!expense) {
                return res.status(404).json({ detail: 'Expense not found' });
            }

            return res.status(200).json({
                id: expense.id,
                category: expense.category,
                amount: expense.amount,
                description: expense.description,
                date: expense.date.toISOString(),
                created_at: expense.created_at?.toISOString()
            });
        } catch (err: any) {
            console.error('GET EXPENSE ERROR:', err);
            return res.status(500).json({ detail: 'Failed to fetch expense' });
        }
    }

    if (req.method === 'PUT') {
        try {
            const expense = await prisma.expense.findFirst({
                where: { id: expenseId, tenant_id: tenantId }
            });

            if (!expense) {
                return res.status(404).json({ detail: 'Expense not found' });
            }

            const { category, amount, description, date } = req.body;

            const updated = await prisma.expense.update({
                where: { id: expenseId },
                data: {
                    category: category !== undefined ? category : expense.category,
                    amount: amount !== undefined ? Number(amount) : expense.amount,
                    description: description !== undefined ? description : expense.description,
                    date: date !== undefined ? new Date(date) : expense.date
                }
            });

            return res.status(200).json({
                id: updated.id,
                category: updated.category,
                amount: updated.amount,
                description: updated.description,
                date: updated.date.toISOString()
            });
        } catch (err: any) {
            console.error('UPDATE EXPENSE ERROR:', err);
            return res.status(500).json({ detail: 'Failed to update expense' });
        }
    }

    if (req.method === 'DELETE') {
        try {
            const expense = await prisma.expense.findFirst({
                where: { id: expenseId, tenant_id: tenantId }
            });

            if (!expense) {
                return res.status(404).json({ detail: 'Expense not found' });
            }

            await prisma.expense.delete({
                where: { id: expenseId }
            });

            return res.status(200).json({ message: 'Expense deleted successfully' });
        } catch (err: any) {
            console.error('DELETE EXPENSE ERROR:', err);
            return res.status(500).json({ detail: 'Failed to delete expense' });
        }
    }

    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).json({ detail: `Method ${req.method} not allowed` });
};

export default withAuth(handler);
