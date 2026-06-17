import { NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { AuthenticatedRequest, withAuth } from '@/lib/api-middleware';
import { logAction } from '@/lib/services';

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;
    const { id } = req.query;

    if (!tenantId) {
        return res.status(400).json({ detail: 'User has no active tenant workspace' });
    }

    const purchaseId = parseInt(id as string);
    if (isNaN(purchaseId)) {
        return res.status(400).json({ detail: 'Invalid purchase ID' });
    }

    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ detail: `Method ${req.method} not allowed` });
    }

    try {
        const purchase = await prisma.purchase.findFirst({
            where: { id: purchaseId, tenant_id: tenantId },
            include: {
                items: true,
                supplier: true
            }
        });

        if (!purchase) {
            return res.status(404).json({ detail: 'Purchase order not found' });
        }

        if (purchase.status === 'Received') {
            return res.status(200).json({ status: 'success', purchase_status: 'Received' });
        }

        // Perform stock increment and supplier outstanding balance update in transaction
        await prisma.$transaction(async (tx) => {
            // Update stock and purchase price for each item
            for (const item of purchase.items) {
                const dbItem = await tx.inventoryItem.findFirst({
                    where: { id: Number(item.item_id), tenant_id: tenantId }
                });
                if (dbItem) {
                    const currentQty = dbItem.quantity ?? 0;
                    await tx.inventoryItem.update({
                        where: { id: dbItem.id },
                        data: {
                            quantity: currentQty + (item.quantity ?? 0),
                            purchase_price: item.price ?? dbItem.purchase_price
                        }
                    });
                }
            }

            // Update Supplier Balance
            if (purchase.supplier_id) {
                const supplier = await tx.supplier.findFirst({
                    where: { id: purchase.supplier_id, tenant_id: tenantId }
                });
                if (supplier) {
                    const currentBalance = supplier.outstanding_balance ?? 0.0;
                    const purchaseTotal = purchase.total_amount ?? 0.0;
                    await tx.supplier.update({
                        where: { id: supplier.id },
                        data: { outstanding_balance: currentBalance + purchaseTotal }
                    });
                }
            }

            // Update status to Received
            await tx.purchase.update({
                where: { id: purchaseId },
                data: { status: 'Received' }
            });
        });

        await logAction(tenantId, userId, "RECEIVE_PURCHASE", "purchase", purchase.id, {
            invoice: purchase.invoice_number,
            status: "Received"
        });

        return res.status(200).json({ status: 'success', purchase_status: 'Received' });
    } catch (err: any) {
        console.error('RECEIVE PURCHASE ERROR:', err);
        return res.status(500).json({ detail: err.message || 'Failed to receive purchase' });
    }
};

export default withAuth(handler);
