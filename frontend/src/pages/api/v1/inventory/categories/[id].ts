import { NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { AuthenticatedRequest, withAuth } from '@/lib/api-middleware';

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const tenantId = req.user.tenant_id;
    const { id } = req.query;

    if (!tenantId) {
        return res.status(400).json({ detail: 'User has no active tenant workspace' });
    }

    const categoryId = parseInt(id as string);
    if (isNaN(categoryId)) {
        return res.status(400).json({ detail: 'Invalid category ID' });
    }

    if (req.method === 'PUT') {
        try {
            const dbCategory = await prisma.category.findFirst({
                where: { id: categoryId, tenant_id: tenantId }
            });

            if (!dbCategory) {
                return res.status(404).json({ detail: 'Category not found' });
            }

            const { name } = req.body;
            if (!name) {
                return res.status(400).json({ detail: 'Category name is required' });
            }

            const updatedCategory = await prisma.category.update({
                where: { id: categoryId },
                data: { name }
            });

            return res.status(200).json(updatedCategory);
        } catch (err: any) {
            console.error('UPDATE CATEGORY ERROR:', err);
            return res.status(500).json({ detail: 'Failed to update category' });
        }
    }

    if (req.method === 'DELETE') {
        try {
            const dbCategory = await prisma.category.findFirst({
                where: { id: categoryId, tenant_id: tenantId }
            });

            if (!dbCategory) {
                return res.status(404).json({ detail: 'Category not found' });
            }

            await prisma.category.delete({
                where: { id: categoryId }
            });

            return res.status(200).json({ message: 'Category deleted successfully' });
        } catch (err: any) {
            console.error('DELETE CATEGORY ERROR:', err);
            return res.status(500).json({ detail: 'Failed to delete category' });
        }
    }

    res.setHeader('Allow', ['PUT', 'DELETE']);
    return res.status(405).json({ detail: `Method ${req.method} not allowed` });
};

export default withAuth(handler);
