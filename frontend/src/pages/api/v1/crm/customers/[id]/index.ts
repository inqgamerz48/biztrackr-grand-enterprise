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

    if (req.method === 'GET') {
        try {
            const customer = await prisma.customer.findFirst({
                where: { id: customerId, tenant_id: tenantId }
            });
            if (!customer) {
                return res.status(404).json({ detail: 'Customer not found' });
            }
            return res.status(200).json(customer);
        } catch (err: any) {
            console.error('GET CUSTOMER ERROR:', err);
            return res.status(500).json({ detail: 'Failed to fetch customer details' });
        }
    }

    if (req.method === 'PUT') {
        try {
            const customer = await prisma.customer.findFirst({
                where: { id: customerId, tenant_id: tenantId }
            });
            if (!customer) {
                return res.status(404).json({ detail: 'Customer not found' });
            }

            const { name, phone, email, address } = req.body;
            const updated = await prisma.customer.update({
                where: { id: customerId },
                data: {
                    name: name !== undefined ? name : customer.name,
                    phone: phone !== undefined ? phone : customer.phone,
                    email: email !== undefined ? email : customer.email,
                    address: address !== undefined ? address : customer.address
                }
            });

            return res.status(200).json(updated);
        } catch (err: any) {
            console.error('UPDATE CUSTOMER ERROR:', err);
            return res.status(500).json({ detail: 'Failed to update customer' });
        }
    }

    if (req.method === 'DELETE') {
        try {
            const customer = await prisma.customer.findFirst({
                where: { id: customerId, tenant_id: tenantId }
            });
            if (!customer) {
                return res.status(404).json({ detail: 'Customer not found' });
            }

            await prisma.customer.delete({
                where: { id: customerId }
            });

            return res.status(200).json({ message: 'Customer deleted successfully' });
        } catch (err: any) {
            console.error('DELETE CUSTOMER ERROR:', err);
            return res.status(500).json({ detail: 'Failed to delete customer' });
        }
    }

    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).json({ detail: `Method ${req.method} not allowed` });
};

export default withAuth(handler);
