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

        const sales = await prisma.sale.findMany({
            where: whereClause,
            include: { customer: true },
            orderBy: { date: 'desc' }
        });

        // Generate CSV content
        let csv = 'Invoice Number,Date,Customer,Total Amount,Discount,Payment Method,Payment Status\n';
        for (const sale of sales) {
            const invoice = sale.invoice_number || '';
            const date = sale.date ? sale.date.toISOString().replace('T', ' ').substring(0, 19) : '';
            const customer = `"${(sale.customer?.name || 'Walk-in').replace(/"/g, '""')}"`;
            const total = sale.total_amount ?? 0.0;
            const discount = sale.discount ?? 0.0;
            const method = sale.payment_method || 'Cash';
            const status = sale.payment_status || 'Paid';

            csv += `${invoice},${date},${customer},${total},${discount},${method},${status}\n`;
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=sales.csv');
        return res.send(csv);
    } catch (err: any) {
        console.error('EXPORT SALES CSV ERROR:', err);
        return res.status(500).json({ detail: 'Failed to export sales CSV' });
    }
};

export default withAuth(handler);
