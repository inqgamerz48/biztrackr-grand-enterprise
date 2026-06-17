import { NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { AuthenticatedRequest, withAuth } from '@/lib/api-middleware';

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const tenantId = req.user.tenant_id;
    const { barcode } = req.query;

    if (!tenantId) {
        return res.status(400).json({ detail: 'User has no active tenant workspace' });
    }

    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ detail: `Method ${req.method} not allowed` });
    }

    try {
        const barcodeStr = String(barcode).trim();

        // 1. Try exact barcode match
        let item = await prisma.inventoryItem.findFirst({
            where: { tenant_id: tenantId, barcode: barcodeStr },
            include: { category: true }
        });

        // 2. Fallback: Try ID match if barcode is numeric
        if (!item && /^\d+$/.test(barcodeStr)) {
            const numericId = parseInt(barcodeStr);
            item = await prisma.inventoryItem.findFirst({
                where: { tenant_id: tenantId, id: numericId },
                include: { category: true }
            });
        }

        if (!item) {
            return res.status(404).json({ detail: 'Item not found' });
        }

        return res.status(200).json(item);
    } catch (err: any) {
        console.error('SCAN INVENTORY ERROR:', err);
        return res.status(500).json({ detail: 'Failed to scan barcode' });
    }
};

export default withAuth(handler);
