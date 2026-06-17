import { NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { AuthenticatedRequest, withAuth } from '@/lib/api-middleware';

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const tenantId = req.user.tenant_id;

    if (!tenantId) {
        return res.status(400).json({ detail: 'User has no active tenant workspace' });
    }

    if (req.method === 'GET') {
        try {
            const suppliers = await prisma.supplier.findMany({
                where: { tenant_id: tenantId },
                orderBy: { name: 'asc' }
            });
            return res.status(200).json(suppliers);
        } catch (err: any) {
            console.error('FETCH SUPPLIERS ERROR:', err);
            return res.status(500).json({ detail: 'Failed to fetch suppliers' });
        }
    }

    if (req.method === 'POST') {
        try {
            const { name, phone, email, address } = req.body;
            if (!name) {
                return res.status(400).json({ detail: 'Supplier Name is required' });
            }

            const supplier = await prisma.supplier.create({
                data: {
                    name,
                    phone: phone || null,
                    email: email || null,
                    address: address || null,
                    outstanding_balance: 0.0,
                    tenant_id: tenantId
                }
            });

            return res.status(201).json(supplier);
        } catch (err: any) {
            console.error('CREATE SUPPLIER ERROR:', err);
            return res.status(500).json({ detail: 'Failed to create supplier' });
        }
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ detail: `Method ${req.method} not allowed` });
};

export default withAuth(handler);
