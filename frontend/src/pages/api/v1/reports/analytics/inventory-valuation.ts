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
            select: {
                quantity: true,
                purchase_price: true,
                selling_price: true
            }
        });

        let purchaseValue = 0.0;
        let sellingValue = 0.0;
        let totalQuantity = 0;

        for (const item of items) {
            const qty = item.quantity || 0;
            purchaseValue += qty * (item.purchase_price || 0.0);
            sellingValue += qty * (item.selling_price || 0.0);
            totalQuantity += qty;
        }

        return res.status(200).json({
            purchase_value: purchaseValue,
            selling_value: sellingValue,
            total_items: items.length,
            total_quantity: totalQuantity
        });
    } catch (err: any) {
        console.error('GET INVENTORY VALUATION ERROR:', err);
        return res.status(500).json({ detail: 'Failed to fetch inventory valuation analytics' });
    }
};

export default withAuth(handler);
