import { prisma } from './prisma';

export async function logAction(
    tenantId: number,
    userId: number,
    action: string,
    entityType: string,
    entityId?: number,
    details?: any
) {
    try {
        await prisma.activityLog.create({
            data: {
                tenant_id: tenantId,
                user_id: userId,
                action,
                entity_type: entityType,
                entity_id: entityId || null,
                details: details ? JSON.parse(JSON.stringify(details)) : null
            }
        });
    } catch (e) {
        console.error("Failed to create activity log:", e);
    }
}

export async function createNotification(
    tenantId: number,
    title: string,
    message: string,
    type: string = 'info',
    userId?: number
) {
    try {
        await prisma.notification.create({
            data: {
                tenant_id: tenantId,
                user_id: userId || null,
                title,
                message,
                type,
                is_read: false
            }
        });
    } catch (e) {
        console.error("Failed to create notification:", e);
    }
}
