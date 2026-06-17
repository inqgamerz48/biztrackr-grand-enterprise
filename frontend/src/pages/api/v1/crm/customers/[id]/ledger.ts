import { NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { AuthenticatedRequest, withAuth } from '@/lib/api-middleware';

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const tenantId = req.user.tenant_id;
    const { id } = req.query;

    if (!tenantId) {
        return res.status(400).json({ detail: 'User has no active tenant workspace' });
    }

    const customerId = parseInt(id as string);
    if (isNaN(customerId)) {
        return res.status(400).json({ detail: 'Invalid Customer ID' });
    }

    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ detail: `Method ${req.method} not allowed` });
    }

    try {
        const sales = await prisma.sale.findMany({
            where: { customer_id: customerId, tenant_id: tenantId }
        });

        const payments = await prisma.payment.findMany({
            where: { customer_id: customerId, tenant_id: tenantId }
        });

        const transactions: any[] = [];

        // Map Sales (debit - increase customer debt)
        for (const sale of sales) {
            transactions.push({
                id: sale.id,
                type: 'SALE',
                date: sale.date || new Date(),
                description: `Invoice #${sale.invoice_number}`,
                debit: sale.total_amount || 0.0,
                credit: 0.0,
                ref_id: sale.id
            });

            // If sale was partially/fully paid at checkout, add synthesized payment (credit)
            const amtPaid = sale.amount_paid || 0.0;
            if (amtPaid > 0) {
                transactions.push({
                    id: sale.id,
                    type: 'PAYMENT',
                    date: sale.date || new Date(),
                    description: `Payment (Invoice #${sale.invoice_number})`,
                    debit: 0.0,
                    credit: amtPaid,
                    ref_id: sale.id
                });
            }
        }

        // Map Payments (credit - decrease customer debt)
        for (const payment of payments) {
            transactions.push({
                id: payment.id,
                type: 'PAYMENT',
                date: payment.date || new Date(),
                description: `Payment (${payment.payment_method || 'Cash'})`,
                debit: 0.0,
                credit: payment.amount || 0.0,
                ref_id: payment.id
            });
        }

        // Sort chronologically
        transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Calculate running balance
        let balance = 0.0;
        const ledger = transactions.map(txn => {
            balance += txn.debit - txn.credit;
            return {
                ...txn,
                date: txn.date.toISOString(),
                balance
            };
        });

        return res.status(200).json(ledger);
    } catch (err: any) {
        console.error('GET CUSTOMER LEDGER ERROR:', err);
        return res.status(500).json({ detail: 'Failed to fetch customer ledger' });
    }
};

export default withAuth(handler);
