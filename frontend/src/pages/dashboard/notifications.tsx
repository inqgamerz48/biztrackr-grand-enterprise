import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import api from '@/lib/axios';
import { format } from 'date-fns';
import { Bell, Check, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface Notification {
    id: number;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
    is_read: boolean;
    created_at: string;
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications/');
            setNotifications(res.data);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: number) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(notifications.filter(n => n.id !== id));
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications([]);
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'warning': return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
            case 'success': return <CheckCircle className="h-6 w-6 text-green-500" />;
            case 'error': return <XCircle className="h-6 w-6 text-red-500" />;
            default: return <Info className="h-6 w-6 text-primary" />;
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Notifications</h1>
                    {notifications.length > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-primary-foreground bg-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                        >
                            <Check className="mr-2 h-4 w-4" />
                            Mark all as read
                        </button>
                    )}
                </div>

                <div className="bg-card border border-border shadow-none overflow-hidden sm:rounded-lg">
                    {loading ? (
                        <div className="p-6 text-center text-muted-foreground">Loading notifications...</div>
                    ) : notifications.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center">
                            <div className="p-3 bg-muted rounded-full mb-4 border border-border">
                                <Bell className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-lg font-medium text-foreground">No new notifications</h3>
                            <p className="mt-1 text-muted-foreground">You're all caught up!</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-border">
                            {notifications.map((notification) => (
                                <li key={notification.id} className="p-6 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-start space-x-4">
                                        <div className="flex-shrink-0">
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground">
                                                {notification.title}
                                            </p>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                {format(new Date(notification.created_at), 'MMM d, yyyy HH:mm')}
                                            </p>
                                        </div>
                                        <div>
                                            <button
                                                onClick={() => markAsRead(notification.id)}
                                                className="text-muted-foreground hover:text-foreground"
                                                title="Mark as read"
                                            >
                                                <Check className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
