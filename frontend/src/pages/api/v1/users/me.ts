import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { prisma } from '@/lib/prisma';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
    const userId = req.user.id;

    if (req.method === 'GET') {
        try {
            // Fetch user permissions from DB role relations
            const userWithPermissions = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    role_obj: {
                        include: {
                            permissions: true
                        }
                    },
                    tenant: true,
                    branch: true
                }
            });

            if (!userWithPermissions) {
                return res.status(404).json({ detail: 'User not found' });
            }

            // Map permission codes list
            const permissions = userWithPermissions.role_obj?.permissions.map(p => p.code) || [];

            // Return user object compatible with frontend expects
            return res.status(200).json({
                id: userWithPermissions.id,
                email: userWithPermissions.email,
                full_name: userWithPermissions.full_name,
                role: userWithPermissions.role,
                is_active: userWithPermissions.is_active ?? true,
                is_superuser: userWithPermissions.is_superuser ?? false,
                tenant_id: userWithPermissions.tenant_id,
                permissions: permissions
            });
        } catch (error: any) {
            console.error('FETCH USER PROFILE ERROR:', error);
            return res.status(500).json({ detail: 'Failed to retrieve profile' });
        }
    }

    if (req.method === 'PUT') {
        const { full_name, email } = req.body;

        try {
            // Check email duplication if being updated
            if (email && email !== req.user.email) {
                const emailExists = await prisma.user.findUnique({
                    where: { email }
                });
                if (emailExists) {
                    return res.status(400).json({ detail: 'Email already registered' });
                }
            }

            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    full_name: full_name !== undefined ? full_name : undefined,
                    email: email !== undefined ? email : undefined
                },
                include: {
                    role_obj: {
                        include: {
                            permissions: true
                        }
                    }
                }
            });

            const permissions = updatedUser.role_obj?.permissions.map(p => p.code) || [];

            return res.status(200).json({
                id: updatedUser.id,
                email: updatedUser.email,
                full_name: updatedUser.full_name,
                role: updatedUser.role,
                is_active: updatedUser.is_active ?? true,
                is_superuser: updatedUser.is_superuser ?? false,
                tenant_id: updatedUser.tenant_id,
                permissions: permissions
            });
        } catch (error: any) {
            console.error('UPDATE USER PROFILE ERROR:', error);
            return res.status(500).json({ detail: 'Failed to update profile' });
        }
    }

    return res.status(405).json({ detail: 'Method Not Allowed' });
}

export default withAuth(handler);
