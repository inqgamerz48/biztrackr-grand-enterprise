import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { prisma } from '@/lib/prisma';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ detail: 'Method Not Allowed' });
    }

    const tenantId = req.user.tenant_id;
    if (!tenantId) {
        return res.status(400).json({ detail: 'Tenant missing' });
    }

    try {
        const insights: string[] = [];

        // 1. Low stock alert
        const lowStockItems = await prisma.$queryRaw<Array<{ name: string }>>`
            SELECT name FROM items 
            WHERE tenant_id = ${tenantId} AND quantity <= min_stock 
            LIMIT 3
        `;

        if (lowStockItems.length > 0) {
            const names = lowStockItems.map(item => item.name).join(', ');
            insights.push(`⚠️ Low stock alert: ${names}. Consider restocking soon.`);
        }

        // 2. Top Customer
        const topCustomerAggregate = await prisma.sale.groupBy({
            by: ['customer_id'],
            where: {
                tenant_id: tenantId,
                customer_id: { not: null }
            },
            _sum: {
                total_amount: true
            },
            orderBy: {
                _sum: {
                    total_amount: 'desc'
                }
            },
            take: 1
        });

        if (topCustomerAggregate.length > 0) {
            const topCust = topCustomerAggregate[0];
            const customer = await prisma.customer.findUnique({
                where: { id: topCust.customer_id! }
            });
            if (customer) {
                const total = topCust._sum.total_amount || 0;
                insights.push(`🏆 Top customer: ${customer.name} (Total purchases: ₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })})`);
            }
        }

        return res.status(200).json({ insights });
    } catch (error: any) {
        console.error('AI INSIGHTS ERROR:', error);
        return res.status(500).json({ detail: 'Failed to fetch insights' });
    }
}

export default withAuth(handler);
