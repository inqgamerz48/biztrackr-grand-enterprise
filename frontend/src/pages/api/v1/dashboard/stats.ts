import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { prisma } from '@/lib/prisma';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ detail: 'Method Not Allowed' });
    }

    const tenantId = req.user.tenant_id;
    if (!tenantId) {
        return res.status(400).json({ detail: 'User is not associated with a tenant.' });
    }

    try {
        // Today and Yesterday date calculations
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const yesterdayStart = new Date(todayStart);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);

        const yesterdayEnd = new Date(todayEnd);
        yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);

        // 1. Sales Today
        const salesTodayAggregate = await prisma.sale.aggregate({
            where: {
                tenant_id: tenantId,
                date: {
                    gte: todayStart,
                    lte: todayEnd
                }
            },
            _sum: {
                total_amount: true
            }
        });
        const salesToday = salesTodayAggregate._sum.total_amount || 0.0;

        // 2. Sales Yesterday
        const salesYesterdayAggregate = await prisma.sale.aggregate({
            where: {
                tenant_id: tenantId,
                date: {
                    gte: yesterdayStart,
                    lte: yesterdayEnd
                }
            },
            _sum: {
                total_amount: true
            }
        });
        const salesYesterday = salesYesterdayAggregate._sum.total_amount || 0.0;

        // 3. Active Inventory count
        const totalItems = await prisma.inventoryItem.count({
            where: {
                tenant_id: tenantId
            }
        });

        // 4. Low Stock count (quantity <= min_stock)
        // Since Prisma doesn't support direct column comparisons in "where" clauses easily without raw SQL,
        // we'll run a raw query or fetch and filter, or execute a direct Raw query since it is high performance.
        const lowStockItemsRaw = await prisma.$queryRaw<Array<{ count: bigint }>>`
            SELECT COUNT(*)::bigint as count 
            FROM items 
            WHERE tenant_id = ${tenantId} AND quantity <= min_stock
        `;
        const lowStockItems = Number(lowStockItemsRaw[0]?.count || 0);

        // Calculate sales trend percentage
        let trendPercent = 0.0;
        if (salesYesterday > 0) {
            trendPercent = ((salesToday - salesYesterday) / salesYesterday) * 100;
        } else if (salesToday > 0) {
            trendPercent = 100.0;
        }

        return res.status(200).json({
            sales_today: salesToday,
            sales_yesterday: salesYesterday,
            sales_trend: Math.round(trendPercent * 10) / 10,
            total_inventory: totalItems,
            low_stock_items: lowStockItems
        });
    } catch (error: any) {
        console.error('DASHBOARD STATS FETCH ERROR:', error);
        return res.status(500).json({ detail: 'Failed to fetch dashboard stats' });
    }
}

export default withAuth(handler);
