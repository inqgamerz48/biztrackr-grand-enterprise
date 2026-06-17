import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from './supabase';
import { prisma } from './prisma';

export interface AuthenticatedRequest extends NextApiRequest {
    user: {
        id: number;
        email: string;
        role: string;
        tenant_id: number | null;
        supabase_uid: string;
    };
}

export function withAuth(handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>) {
    return async (req: NextApiRequest, res: NextApiResponse) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ detail: 'Missing or invalid authentication header' });
        }

        const token = authHeader.split(' ')[1];

        try {
            // Verify with Supabase GoTrue API
            const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);
            if (error || !supabaseUser) {
                return res.status(401).json({ detail: 'Invalid token or session expired' });
            }

            // Look up or auto-provision local DB user
            let dbUser = await prisma.user.findUnique({
                where: { supabase_uid: supabaseUser.id },
                include: { tenant: true }
            });

            // Match legacy user by email if no supabase_uid is set
            if (!dbUser && supabaseUser.email) {
                dbUser = await prisma.user.findUnique({
                    where: { email: supabaseUser.email },
                    include: { tenant: true }
                });
                if (dbUser) {
                    dbUser = await prisma.user.update({
                        where: { id: dbUser.id },
                        data: { supabase_uid: supabaseUser.id },
                        include: { tenant: true }
                    });
                }
            }

            // Auto-provision new user & workspace
            if (!dbUser) {
                const tenantName = `${supabaseUser.email?.split('@')[0]}'s Workspace`;
                const newTenant = await prisma.tenant.create({
                    data: {
                        name: tenantName,
                        plan: 'free'
                    }
                });

                dbUser = await prisma.user.create({
                    data: {
                        email: supabaseUser.email || `user_${supabaseUser.id.substring(0, 8)}@supabase.io`,
                        supabase_uid: supabaseUser.id,
                        tenant_id: newTenant.id,
                        role: 'admin',
                        is_active: true,
                        is_superuser: false
                    },
                    include: { tenant: true }
                });
            }

            if (!dbUser.is_active) {
                return res.status(403).json({ detail: 'Inactive user account' });
            }

            // Inject the authenticated user details into request
            (req as AuthenticatedRequest).user = {
                id: dbUser.id,
                email: dbUser.email,
                role: dbUser.role,
                tenant_id: dbUser.tenant_id,
                supabase_uid: dbUser.supabase_uid!
            };

            return handler(req as AuthenticatedRequest, res);
        } catch (err: any) {
            console.error('API AUTH ERROR:', err);
            return res.status(500).json({ detail: 'Internal Server Error' });
        }
    };
}

// Helper to enforce specific roles (e.g. Admin only)
export function requireRole(allowedRoles: string[], handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>) {
    return withAuth(async (req, res) => {
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ detail: `Access denied. Requires one of roles: ${allowedRoles.join(', ')}` });
        }
        return handler(req, res);
    });
}
