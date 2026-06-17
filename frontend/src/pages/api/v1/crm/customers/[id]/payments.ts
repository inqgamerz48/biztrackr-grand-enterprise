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

    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ detail: `Method ${req.method} not allowed` });
    }

    try {
        const { amount, date, payment_method = 'Cash', reference_number, notes } = req.body;

        if (!amount || Number(amount) <= 0) {
            return res.status(400).json({ detail: 'Valid payment amount is required' });
        }

        const customer = await prisma.customer.findFirst({
            where: { id: customerId, tenant_id: tenantId }
        });

        if (!customer) {
            return res.status(404).json({ detail: 'Customer not found' });
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
                    customer_id: customerId,
                    tenant_id: tenantId
                }
            });

            // Reduce customer outstanding balance
            const currentOutstanding = customer.outstanding_balance ?? 0.0;
            await tx.customer.update({
                where: { id: customerId },
                data: { outstanding_balance: currentOutstanding - Number(amount) }
            });

            return newPayment;
        });

        return res.status(201).json(payment);
    } catch (err: any) {
        console.error('CREATE CUSTOMER PAYMENT ERROR:', err);
        return res.status(500).json({ detail: 'Failed to record customer payment' });
    }
};

export default withAuth(handler);
