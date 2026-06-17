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
            const customers = await prisma.customer.findMany({
                where: { tenant_id: tenantId },
                orderBy: { name: 'asc' }
            });
            return res.status(200).json(customers);
        } catch (err: any) {
            console.error('FETCH CUSTOMERS ERROR:', err);
            return res.status(500).json({ detail: 'Failed to fetch customers' });
        }
    }

    if (req.method === 'POST') {
        try {
            const { name, phone, email, address } = req.body;
            if (!name || !phone) {
                return res.status(400).json({ detail: 'Name and Phone are required' });
            }

            const customer = await prisma.customer.create({
                data: {
                    name,
                    phone,
                    email: email || null,
                    address: address || null,
                    outstanding_balance: 0.0,
                    tenant_id: tenantId
                }
            });

            return res.status(201).json(customer);
        } catch (err: any) {
            console.error('CREATE CUSTOMER ERROR:', err);
            return res.status(500).json({ detail: 'Failed to create customer' });
        }
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ detail: `Method ${req.method} not allowed` });
};

export default withAuth(handler);
