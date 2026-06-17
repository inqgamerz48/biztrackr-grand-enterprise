import { NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { AuthenticatedRequest, withAuth } from '@/lib/api-middleware';

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const tenantId = req.user.tenant_id;

    if (!tenantId) {
        return res.status(400).json({ detail: 'User has no active tenant workspace' });
    }

    if (req.method === 'GET') {
        const skip = parseInt(req.query.skip as string) || 0;
        const limit = parseInt(req.query.limit as string) || 100;

        try {
            const categories = await prisma.category.findMany({
                where: { tenant_id: tenantId },
                skip,
                take: limit,
                orderBy: { name: 'asc' }
            });
            return res.status(200).json(categories);
        } catch (err: any) {
            console.error('FETCH CATEGORIES ERROR:', err);
            return res.status(500).json({ detail: 'Failed to fetch categories' });
        }
    }

    if (req.method === 'POST') {
        try {
            const { name } = req.body;
            if (!name) {
                return res.status(400).json({ detail: 'Category name is required' });
            }

            const newCategory = await prisma.category.create({
                data: {
                    name,
                    tenant_id: tenantId
                }
            });

            return res.status(201).json(newCategory);
        } catch (err: any) {
            console.error('CREATE CATEGORY ERROR:', err);
            return res.status(500).json({ detail: 'Failed to create category' });
        }
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ detail: `Method ${req.method} not allowed` });
};

export default withAuth(handler);
