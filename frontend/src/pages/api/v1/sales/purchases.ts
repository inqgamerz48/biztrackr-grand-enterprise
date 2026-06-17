import { NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { AuthenticatedRequest, withAuth } from '@/lib/api-middleware';
import { logAction } from '@/lib/services';

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;

    if (!tenantId) {
        return res.status(400).json({ detail: 'User has no active tenant workspace' });
    }

    if (req.method === 'GET') {
        try {
            const purchases = await prisma.purchase.findMany({
                where: { tenant_id: tenantId },
                include: {
                    supplier: true,
                    items: {
                        include: {
                            item: true
                        }
                    }
                },
                orderBy: { date: 'desc' }
            });

            const formatted = purchases.map(p => ({
                id: p.id,
                invoice_number: p.invoice_number,
                date: p.date,
                supplier_name: p.supplier?.name || 'Unknown',
                total_amount: p.total_amount,
                status: p.status,
                items_count: p.items.length
            }));

            return res.status(200).json(formatted);
        } catch (err: any) {
            console.error('GET PURCHASES ERROR:', err);
            return res.status(500).json({ detail: 'Failed to fetch purchases list' });
        }
    }

    if (req.method === 'POST') {
        try {
            const { supplier_id, items, transport_charges = 0, invoice_number } = req.body;

            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ detail: 'At least one item is required for purchase' });
            }

            // Fetch settings for tax rate
            const settings = await prisma.settings.findFirst({
                where: { tenant_id: tenantId }
            });
            const taxRate = settings?.tax_rate || 0.0;

            const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.price)), 0);
            const taxAmount = subtotal * taxRate;
            const totalAmount = subtotal + taxAmount + Number(transport_charges);

            const finalInvoiceNumber = invoice_number || `PO-${Math.floor(Date.now() / 1000)}`;

            const purchase = await prisma.$transaction(async (tx) => {
                const newPurchase = await tx.purchase.create({
                    data: {
                        invoice_number: finalInvoiceNumber,
                        supplier_id: supplier_id ? Number(supplier_id) : null,
                        total_amount: totalAmount,
                        tax_amount: taxAmount,
                        transport_charges: Number(transport_charges),
                        tenant_id: tenantId,
                        status: 'Ordered',
                        amount_paid: 0.0,
                        payment_status: 'pending'
                    }
                });

                for (const item of items) {
                    await tx.purchaseItem.create({
                        data: {
                            purchase_id: newPurchase.id,
                            item_id: Number(item.item_id),
                            quantity: Number(item.quantity),
                            price: Number(item.price),
                            total: Number(item.quantity) * Number(item.price)
                        }
                    });
                }

                return newPurchase;
            });

            await logAction(tenantId, userId, "CREATE_PURCHASE", "purchase", purchase.id, {
                invoice: purchase.invoice_number,
                total: purchase.total_amount
            });

            return res.status(201).json({
                id: purchase.id,
                invoice_number: purchase.invoice_number,
                total: purchase.total_amount
            });
        } catch (err: any) {
            console.error('CREATE PURCHASE ERROR:', err);
            return res.status(500).json({ detail: err.message || 'Failed to create purchase order' });
        }
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ detail: `Method ${req.method} not allowed` });
};

export default withAuth(handler);
