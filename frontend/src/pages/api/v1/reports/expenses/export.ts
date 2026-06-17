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

        const whereClause: any = { tenant_id: tenantId };
        if (startDateParam || endDateParam) {
            whereClause.date = {};
            if (startDateParam) whereClause.date.gte = new Date(startDateParam);
            if (endDateParam) whereClause.date.lte = new Date(endDateParam);
        }

        const expenses = await prisma.expense.findMany({
            where: whereClause,
            orderBy: { date: 'desc' }
        });

        // Generate CSV content
        let csv = 'Date,Category,Amount,Description\n';
        for (const exp of expenses) {
            const date = exp.date ? exp.date.toISOString().split('T')[0] : '';
            const category = `"${(exp.category || '').replace(/"/g, '""')}"`;
            const amount = exp.amount ?? 0.0;
            const description = `"${(exp.description || '').replace(/"/g, '""')}"`;

            csv += `${date},${category},${amount},${description}\n`;
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=expenses.csv');
        return res.send(csv);
    } catch (err: any) {
        console.error('EXPORT EXPENSES CSV ERROR:', err);
        return res.status(500).json({ detail: 'Failed to export expenses CSV' });
    }
};

export default withAuth(handler);
