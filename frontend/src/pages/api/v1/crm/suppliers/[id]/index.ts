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

    if (req.method === 'GET') {
        try {
            const supplier = await prisma.supplier.findFirst({
                where: { id: supplierId, tenant_id: tenantId }
            });
            if (!supplier) {
                return res.status(404).json({ detail: 'Supplier not found' });
            }
            return res.status(200).json(supplier);
        } catch (err: any) {
            console.error('GET SUPPLIER ERROR:', err);
            return res.status(500).json({ detail: 'Failed to fetch supplier details' });
        }
    }

    if (req.method === 'PUT') {
        try {
            const supplier = await prisma.supplier.findFirst({
                where: { id: supplierId, tenant_id: tenantId }
            });
            if (!supplier) {
                return res.status(404).json({ detail: 'Supplier not found' });
            }

            const { name, phone, email, address } = req.body;
            const updated = await prisma.supplier.update({
                where: { id: supplierId },
                data: {
                    name: name !== undefined ? name : supplier.name,
                    phone: phone !== undefined ? phone : supplier.phone,
                    email: email !== undefined ? email : supplier.email,
                    address: address !== undefined ? address : supplier.address
                }
            });

            return res.status(200).json(updated);
        } catch (err: any) {
            console.error('UPDATE SUPPLIER ERROR:', err);
            return res.status(500).json({ detail: 'Failed to update supplier' });
        }
    }

    if (req.method === 'DELETE') {
        try {
            const supplier = await prisma.supplier.findFirst({
                where: { id: supplierId, tenant_id: tenantId }
            });
            if (!supplier) {
                return res.status(404).json({ detail: 'Supplier not found' });
            }

            await prisma.supplier.delete({
                where: { id: supplierId }
            });

            return res.status(200).json({ message: 'Supplier deleted successfully' });
        } catch (err: any) {
            console.error('DELETE SUPPLIER ERROR:', err);
            return res.status(500).json({ detail: 'Failed to delete supplier' });
        }
    }

    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).json({ detail: `Method ${req.method} not allowed` });
};

export default withAuth(handler);
