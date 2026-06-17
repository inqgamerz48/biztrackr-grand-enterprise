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

        const purchases = await prisma.purchase.findMany({
            where: whereClause,
            include: { supplier: true },
            orderBy: { date: 'desc' }
        });

        // Generate CSV content
        let csv = 'Invoice Number,Date,Supplier,Total Amount,Transport Charges,Status\n';
        for (const purchase of purchases) {
            const invoice = purchase.invoice_number || '';
            const date = purchase.date ? purchase.date.toISOString().replace('T', ' ').substring(0, 19) : '';
            const supplier = `"${(purchase.supplier?.name || 'N/A').replace(/"/g, '""')}"`;
            const total = purchase.total_amount ?? 0.0;
            const transport = purchase.transport_charges ?? 0.0;
            const status = purchase.status || 'Ordered';

            csv += `${invoice},${date},${supplier},${total},${transport},${status}\n`;
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=purchases.csv');
        return res.send(csv);
    } catch (err: any) {
        console.error('EXPORT PURCHASES CSV ERROR:', err);
        return res.status(500).json({ detail: 'Failed to export purchases CSV' });
    }
};

export default withAuth(handler);
