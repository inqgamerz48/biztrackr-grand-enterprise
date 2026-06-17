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
        const items = await prisma.inventoryItem.findMany({
            where: { tenant_id: tenantId },
            include: { category: true }
        });

        // Generate CSV content
        let csv = 'Name,Category,Quantity,Selling Price,Purchase Price,Min Stock,Barcode\n';
        for (const item of items) {
            const name = `"${(item.name || '').replace(/"/g, '""')}"`;
            const category = `"${(item.category?.name || '').replace(/"/g, '""')}"`;
            const qty = item.quantity ?? 0;
            const selling = item.selling_price ?? 0.0;
            const purchase = item.purchase_price ?? 0.0;
            const minStock = item.min_stock ?? 5;
            const barcode = item.barcode || 'N/A';

            csv += `${name},${category},${qty},${selling},${purchase},${minStock},${barcode}\n`;
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=inventory.csv');
        return res.send(csv);
    } catch (err: any) {
        console.error('EXPORT INVENTORY CSV ERROR:', err);
        return res.status(500).json({ detail: 'Failed to export inventory CSV' });
    }
};

export default withAuth(handler);
