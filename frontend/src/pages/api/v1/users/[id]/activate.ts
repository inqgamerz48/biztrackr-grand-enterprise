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
        const { is_active } = req.body;
        if (is_active === undefined) {
            return res.status(400).json({ detail: 'is_active field is required' });
        }

        const user = await prisma.user.findFirst({
            where: { id: targetUserId, tenant_id: tenantId }
        });

        if (!user) {
            return res.status(404).json({ detail: 'User not found' });
        }

        // Prevent self-deactivation
        if (user.id === req.user.id) {
            return res.status(400).json({ detail: 'Cannot deactivate your own account' });
        }

        const updated = await prisma.user.update({
            where: { id: targetUserId },
            data: { is_active: Boolean(is_active) }
        });

        return res.status(200).json(updated);
    } catch (err: any) {
        console.error('TOGGLE USER ACTIVATION ERROR:', err);
        return res.status(500).json({ detail: 'Failed to update user activation status' });
    }
};

export default withAuth(handler);
