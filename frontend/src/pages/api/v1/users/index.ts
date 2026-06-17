import { NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { AuthenticatedRequest, withAuth } from '@/lib/api-middleware';

function checkPlanLimits(plan: string, resource: string, count: number): boolean {
    const limits: any = {
        free: {
            users: 3,
            managers: 1,
            cashiers: 1
        },
        starter: {
            users: 5,
            managers: 5,
            cashiers: 5
        }
    };

    const planLimits = limits[plan] || limits.free;
    const limit = planLimits[resource];
    if (limit === undefined) return true; // default no limit
    return count < limit;
}

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const tenantId = req.user.tenant_id;

    if (!tenantId) {
        return res.status(400).json({ detail: 'User has no active tenant workspace' });
    }

    if (req.method === 'GET') {
        // Manager+ can view
        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            return res.status(403).json({ detail: 'Access denied. Managers or Admin only.' });
        }

        try {
            const users = await prisma.user.findMany({
                where: { tenant_id: tenantId },
                orderBy: { id: 'asc' }
            });
            return res.status(200).json(users);
        } catch (err: any) {
            console.error('GET USERS ERROR:', err);
            return res.status(500).json({ detail: 'Failed to fetch users list' });
        }
    }

    if (req.method === 'POST') {
        // Admin only
        if (req.user.role !== 'admin') {
            return res.status(403).json({ detail: 'Access denied. Admin only.' });
        }

        try {
            const { email, full_name, role = 'cashier' } = req.body;

            if (!email) {
                return res.status(400).json({ detail: 'Email is required' });
            }

            const existingUser = await prisma.user.findFirst({
                where: { email }
            });
            if (existingUser) {
                return res.status(400).json({ detail: 'The user with this email already exists in the system.' });
            }

            // Get tenant plan
            const tenant = await prisma.tenant.findUnique({
                where: { id: tenantId }
            });
            const plan = tenant?.plan || 'free';

            // Check total users limit
            const totalCount = await prisma.user.count({
                where: { tenant_id: tenantId }
            });
            if (!checkPlanLimits(plan, 'users', totalCount)) {
                return res.status(403).json({
                    detail: `User limit reached for your '${plan}' plan. Please upgrade to add more users.`
                });
            }

            // Check role limits
            if (role === 'manager' || role === 'cashier') {
                const roleCount = await prisma.user.count({
                    where: { tenant_id: tenantId, role }
                });
                const resourceName = role === 'manager' ? 'managers' : 'cashiers';
                if (!checkPlanLimits(plan, resourceName, roleCount)) {
                    return res.status(403).json({
                        detail: `Limit reached for ${resourceName} in your '${plan}' plan.`
                    });
                }
            }

            // Create user
            const newUser = await prisma.user.create({
                data: {
                    email,
                    full_name: full_name || null,
                    role,
                    tenant_id: tenantId,
                    is_active: true,
                    is_superuser: false
                }
            });

            return res.status(201).json(newUser);
        } catch (err: any) {
            console.error('CREATE USER ERROR:', err);
            return res.status(500).json({ detail: 'Failed to create user' });
        }
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ detail: `Method ${req.method} not allowed` });
};

export default withAuth(handler);
