import { NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { AuthenticatedRequest, withAuth } from '@/lib/api-middleware';
import { logAction, createNotification } from '@/lib/services';

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;
    const { id } = req.query;

    if (!tenantId) {
        return res.status(400).json({ detail: 'User has no active tenant workspace' });
    }

    const itemId = parseInt(id as string);
    if (isNaN(itemId)) {
        return res.status(400).json({ detail: 'Invalid item ID' });
    }

    // Manager+ access for modification
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
        return res.status(403).json({ detail: 'Access denied. Managers or Admin only.' });
    }

    if (req.method === 'PUT') {
        try {
            const dbItem = await prisma.inventoryItem.findFirst({
                where: { id: itemId, tenant_id: tenantId }
            });

            if (!dbItem) {
                return res.status(404).json({ detail: 'Item not found' });
            }

            const {
                name,
                barcode,
                quantity,
                min_stock,
                mrp,
                purchase_price,
                selling_price,
                tax_rate,
                image_url,
                category_id,
                branch_id,
                supplier_id
            } = req.body;

            const updateData: any = {};
            if (name !== undefined) updateData.name = name;
            if (barcode !== undefined) updateData.barcode = barcode;
            if (quantity !== undefined) updateData.quantity = Number(quantity);
            if (min_stock !== undefined) updateData.min_stock = Number(min_stock);
            if (mrp !== undefined) updateData.mrp = mrp !== null ? Number(mrp) : null;
            if (purchase_price !== undefined) updateData.purchase_price = Number(purchase_price);
            if (selling_price !== undefined) updateData.selling_price = Number(selling_price);
            if (tax_rate !== undefined) updateData.tax_rate = tax_rate !== null ? Number(tax_rate) : null;
            if (image_url !== undefined) updateData.image_url = image_url;
            if (category_id !== undefined) updateData.category_id = category_id ? Number(category_id) : null;
            if (branch_id !== undefined) updateData.branch_id = branch_id ? Number(branch_id) : null;
            if (supplier_id !== undefined) updateData.supplier_id = supplier_id ? Number(supplier_id) : null;

            const oldValues = {
                name: dbItem.name,
                barcode: dbItem.barcode,
                quantity: dbItem.quantity,
                min_stock: dbItem.min_stock,
                mrp: dbItem.mrp,
                purchase_price: dbItem.purchase_price,
                selling_price: dbItem.selling_price,
                tax_rate: dbItem.tax_rate,
                image_url: dbItem.image_url,
                category_id: dbItem.category_id,
                branch_id: dbItem.branch_id,
                supplier_id: dbItem.supplier_id
            };

            const updatedItem = await prisma.inventoryItem.update({
                where: { id: itemId },
                data: updateData,
                include: {
                    category: true,
                    supplier: true,
                    branch: true
                }
            });

            await logAction(tenantId, userId, "UPDATE_ITEM", "item", itemId, {
                changes: updateData,
                old_values: oldValues
            });

            // Low Stock check
            const finalQty = updatedItem.quantity ?? 0;
            const finalMin = updatedItem.min_stock ?? 5;
            if (quantity !== undefined && finalQty <= finalMin) {
                const admins = await prisma.user.findMany({
                    where: { tenant_id: tenantId, role: 'admin' }
                });
                for (const admin of admins) {
                    await createNotification(
                        tenantId,
                        "Low Stock Alert",
                        `Item '${updatedItem.name}' is low on stock. Current quantity: ${finalQty} (Min: ${finalMin})`,
                        "warning",
                        admin.id
                    );
                }
            }

            return res.status(200).json(updatedItem);
        } catch (err: any) {
            console.error('UPDATE INVENTORY ITEM ERROR:', err);
            return res.status(500).json({ detail: 'Failed to update inventory item' });
        }
    }

    if (req.method === 'DELETE') {
        try {
            const dbItem = await prisma.inventoryItem.findFirst({
                where: { id: itemId, tenant_id: tenantId }
            });

            if (!dbItem) {
                return res.status(404).json({ detail: 'Item not found' });
            }

            await prisma.inventoryItem.delete({
                where: { id: itemId }
            });

            await logAction(tenantId, userId, "DELETE_ITEM", "item", itemId, {
                name: dbItem.name
            });

            return res.status(200).json({ message: 'Item deleted successfully' });
        } catch (err: any) {
            console.error('DELETE INVENTORY ITEM ERROR:', err);
            return res.status(500).json({ detail: 'Failed to delete inventory item' });
        }
    }

    res.setHeader('Allow', ['PUT', 'DELETE']);
    return res.status(405).json({ detail: `Method ${req.method} not allowed` });
};

export default withAuth(handler);
