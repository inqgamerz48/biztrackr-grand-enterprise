import { NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { AuthenticatedRequest, withAuth } from '@/lib/api-middleware';
import { logAction, createNotification } from '@/lib/services';

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;

    if (!tenantId) {
        return res.status(400).json({ detail: 'User has no active tenant workspace' });
    }

    if (req.method === 'POST') {
        try {
            const { customer_id, items, payment_method = 'Cash', discount = 0, account_id } = req.body;

            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ detail: 'At least one item is required' });
            }

            // Fetch settings for tax rate
            const settings = await prisma.settings.findFirst({
                where: { tenant_id: tenantId }
            });
            const taxRate = settings?.tax_rate || 0.0;

            let totalAmount = 0.0;
            const saleItemsData: any[] = [];

            // Validate all items first
            for (const itemData of items) {
                const dbItem = await prisma.inventoryItem.findFirst({
                    where: { id: Number(itemData.item_id), tenant_id: tenantId }
                });

                if (!dbItem) {
                    return res.status(400).json({ detail: `Item not found with ID: ${itemData.item_id}` });
                }

                const qty = Number(itemData.quantity) || 0;
                const dbQty = dbItem.quantity ?? 0;
                if (dbQty < qty) {
                    return res.status(400).json({
                        detail: `Insufficient stock for item: ${dbItem.name}. Available: ${dbQty}, Requested: ${qty}`
                    });
                }

                const itemDiscount = Number(itemData.discount) || 0;
                const sellingPrice = dbItem.selling_price ?? 0.0;
                const itemTotal = (sellingPrice * qty) - itemDiscount;
                totalAmount += itemTotal;

                saleItemsData.push({
                    dbItem,
                    quantity: qty,
                    price: sellingPrice,
                    discount: itemDiscount,
                    total: itemTotal
                });
            }

            // Calculations
            const totalAfterDiscount = totalAmount - Number(discount);
            const taxAmount = totalAfterDiscount * taxRate;
            const finalTotal = totalAfterDiscount + taxAmount;

            let paymentStatus = 'paid';
            let amountPaid = finalTotal;

            if (payment_method === 'Credit') {
                paymentStatus = 'pending';
                amountPaid = 0.0;
            }

            const invoiceNumber = `INV-${Math.floor(Date.now() / 1000)}`;

            // Database Transaction for atomicity
            const sale = await prisma.$transaction(async (tx: any) => {
                // 1. Create Sale
                const newSale = await tx.sale.create({
                    data: {
                        invoice_number: invoiceNumber,
                        customer_id: customer_id ? Number(customer_id) : null,
                        total_amount: finalTotal,
                        tax_amount: taxAmount,
                        discount: Number(discount),
                        payment_method,
                        payment_account_id: account_id ? Number(account_id) : null,
                        payment_status: paymentStatus,
                        amount_paid: amountPaid,
                        tenant_id: tenantId
                    }
                });

                // 2. Create SaleItems and update stock
                for (const item of saleItemsData) {
                    await tx.saleItem.create({
                        data: {
                            sale_id: newSale.id,
                            item_id: item.dbItem.id,
                            quantity: item.quantity,
                            price: item.price,
                            discount: item.discount,
                            total: item.total
                        }
                    });

                    // Update item stock
                    const newQty = (item.dbItem.quantity ?? 0) - item.quantity;
                    await tx.inventoryItem.update({
                        where: { id: item.dbItem.id },
                        data: { quantity: newQty }
                    });

                    // Trigger low stock checks in background or separate context later
                }

                // 3. Customer outstanding balance
                if (customer_id && payment_method === 'Credit') {
                    const customer = await tx.customer.findFirst({
                        where: { id: Number(customer_id), tenant_id: tenantId }
                    });
                    if (customer) {
                        const currentBalance = customer.outstanding_balance ?? 0.0;
                        await tx.customer.update({
                            where: { id: customer.id },
                            data: { outstanding_balance: currentBalance + finalTotal }
                        });
                    }
                }

                // 4. Payment account balance
                if (account_id && payment_method !== 'Credit') {
                    const account = await tx.paymentAccount.findFirst({
                        where: { id: Number(account_id), tenant_id: tenantId }
                    });
                    if (account) {
                        const currentBalance = account.balance ?? 0.0;
                        await tx.paymentAccount.update({
                            where: { id: account.id },
                            data: { balance: currentBalance + finalTotal }
                        });
                    }
                }

                return newSale;
            });

            // Post-sale actions (async/non-blocking for transaction)
            for (const item of saleItemsData) {
                const updatedQty = (item.dbItem.quantity ?? 0) - item.quantity;
                const minStock = item.dbItem.min_stock ?? 5;
                if (updatedQty <= minStock) {
                    const admins = await prisma.user.findMany({
                        where: { tenant_id: tenantId, role: 'admin' }
                    });
                    for (const admin of admins) {
                        await createNotification(
                            tenantId,
                            "Low Stock Alert",
                            `Item '${item.dbItem.name}' is low on stock. Current quantity: ${updatedQty} (Min: ${minStock})`,
                            "warning",
                            admin.id
                        );
                    }
                }
            }

            await logAction(tenantId, userId, "CREATE_SALE", "sale", sale.id, {
                invoice: sale.invoice_number,
                total: sale.total_amount
            });

            return res.status(201).json({
                id: sale.id,
                invoice_number: sale.invoice_number,
                total: sale.total_amount
            });
        } catch (err: any) {
            console.error('CREATE SALE ERROR:', err);
            return res.status(500).json({ detail: err.message || 'Failed to create sale' });
        }
    }

    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ detail: `Method ${req.method} not allowed` });
};

export default withAuth(handler);
