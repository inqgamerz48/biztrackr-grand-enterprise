import { NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { AuthenticatedRequest, withAuth } from '@/lib/api-middleware';

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const tenantId = req.user.tenant_id;
    const { id } = req.query;

    if (!tenantId) {
        return res.status(400).json({ detail: 'User has no active tenant workspace' });
    }

    const targetUserId = parseInt(id as string);
    if (isNaN(targetUserId)) {
        return res.status(400).json({ detail: 'Invalid User ID' });
    }

    if (req.method !== 'PUT') {
        res.setHeader('Allow', ['PUT']);
        return res.status(405).json({ detail: `Method ${req.method} not allowed` });
    }

    // Admin only
    if (req.user.role !== 'admin') {
        return res.status(403).json({ detail: 'Access denied. Admin only.' });
    }

    try {
        const { role } = req.body;
        const validRoles = ['admin', 'manager', 'cashier'];
        if (!role || !validRoles.includes(role)) {
            return res.status(400).json({ detail: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
        }

        const user = await prisma.user.findFirst({
            where: { id: targetUserId, tenant_id: tenantId }
        });

        if (!user) {
            return res.status(404).json({ detail: 'User not found' });
        }

        // Prevent self-demotion
        if (user.id === req.user.id) {
            return res.status(400).json({ detail: 'Cannot change your own role' });
        }

        const updated = await prisma.user.update({
            where: { id: targetUserId },
            data: { role }
        });

        return res.status(200).json(updated);
    } catch (err: any) {
        console.error('UPDATE USER ROLE ERROR:', err);
        return res.status(500).json({ detail: 'Failed to update user role' });
    }
};

export default withAuth(handler);
