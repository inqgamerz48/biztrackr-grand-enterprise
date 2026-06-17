import { NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { AuthenticatedRequest, withAuth } from '@/lib/api-middleware';

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const tenantId = req.user.tenant_id;
    const { id } = req.query;

    if (!tenantId) {
        return res.status(400).json({ detail: 'User has no active tenant workspace' });
    }

    const supplierId = parseInt(id as string);
    if (isNaN(supplierId)) {
        return res.status(400).json({ detail: 'Invalid Supplier ID' });
    }

    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ detail: `Method ${req.method} not allowed` });
    }

    try {
        const purchases = await prisma.purchase.findMany({
            where: { supplier_id: supplierId, tenant_id: tenantId }
        });

        const payments = await prisma.payment.findMany({
            where: { supplier_id: supplierId, tenant_id: tenantId }
        });

        const transactions: any[] = [];

        // Map Purchases (credit - increase payable balance)
        for (const purchase of purchases) {
            transactions.push({
                id: purchase.id,
                type: 'PURCHASE',
                date: purchase.date || new Date(),
                description: `Invoice #${purchase.invoice_number}`,
                debit: 0.0,
                credit: purchase.total_amount || 0.0,
                ref_id: purchase.id
            });

            // If purchase was partially/fully paid at checkout, add synthesized payment (debit)
            const amtPaid = purchase.amount_paid || 0.0;
            if (amtPaid > 0) {
                transactions.push({
                    id: purchase.id,
                    type: 'PAYMENT',
                    date: purchase.date || new Date(),
                    description: `Payment (PO #${purchase.invoice_number})`,
                    debit: amtPaid,
                    credit: 0.0,
                    ref_id: purchase.id
                });
            }
        }

        // Map Payments (debit - decrease payable balance)
        for (const payment of payments) {
            transactions.push({
                id: payment.id,
                type: 'PAYMENT',
                date: payment.date || new Date(),
                description: `Payment (${payment.payment_method || 'Cash'})`,
                debit: payment.amount || 0.0,
                credit: 0.0,
                ref_id: payment.id
            });
        }

        // Sort chronologically
        transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Calculate running balance (payable outstanding)
        let balance = 0.0;
        const ledger = transactions.map(txn => {
            balance += txn.credit - txn.debit;
            return {
                ...txn,
                date: txn.date.toISOString(),
                balance
            };
        });

        return res.status(200).json(ledger);
    } catch (err: any) {
        console.error('GET SUPPLIER LEDGER ERROR:', err);
        return res.status(500).json({ detail: 'Failed to fetch supplier ledger' });
    }
};

export default withAuth(handler);
