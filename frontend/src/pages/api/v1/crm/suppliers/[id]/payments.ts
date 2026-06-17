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

    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ detail: `Method ${req.method} not allowed` });
    }

    try {
        const { amount, date, payment_method = 'Cash', reference_number, notes } = req.body;

        if (!amount || Number(amount) <= 0) {
            return res.status(400).json({ detail: 'Valid payment amount is required' });
        }

        const supplier = await prisma.supplier.findFirst({
            where: { id: supplierId, tenant_id: tenantId }
        });

        if (!supplier) {
            return res.status(404).json({ detail: 'Supplier not found' });
        }

        const payment = await prisma.$transaction(async (tx: any) => {
            // Create payment record
            const newPayment = await tx.payment.create({
                data: {
                    amount: Number(amount),
                    date: date ? new Date(date) : new Date(),
                    payment_method,
                    reference_number: reference_number || null,
                    notes: notes || null,
                    supplier_id: supplierId,
                    tenant_id: tenantId
                }
            });

            // Reduce supplier outstanding balance (debt we owe them)
            const currentOutstanding = supplier.outstanding_balance ?? 0.0;
            await tx.supplier.update({
                where: { id: supplierId },
                data: { outstanding_balance: currentOutstanding - Number(amount) }
            });

            return newPayment;
        });

        return res.status(201).json(payment);
    } catch (err: any) {
        console.error('CREATE SUPPLIER PAYMENT ERROR:', err);
        return res.status(500).json({ detail: 'Failed to record supplier payment' });
    }
};

export default withAuth(handler);
