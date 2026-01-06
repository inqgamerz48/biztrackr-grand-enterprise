import { useState, useEffect, useRef } from 'react';
import api from '@/lib/axios';
import Link from 'next/link';

interface Notification {
    id: number;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    created_at: string;
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications/?limit=5');
            setNotifications(res.data);
            const countRes = await api.get('/notifications/unread-count');
            setUnreadCount(countRes.data);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    const markAsRead = async (id: number) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/mark-all-read');
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    };

    return (

        <div className="relative ml-3" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-charcoal p-2 rounded-full text-white/50 hover:text-white hover:bg-white/5 transition-colors focus:outline-none border border-white/5"
            >
                <span className="sr-only">View notifications</span>
                {/* Bell Icon */}
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 block h-2 w-2 rounded-full ring-2 ring-charcoal bg-neon-lime shadow-[0_0_8px_#ccff00]" />
                )}
            </button>

            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-xl shadow-2xl border border-white/5 py-1 bg-charcoal/90 backdrop-blur-md ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center bg-white/5">
                        <h3 className="text-sm font-display font-medium text-white tracking-wide">NOTIFICATIONS</h3>
                        {unreadCount > 0 && (
                            <button onClick={markAllAsRead} className="text-xs text-neon-lime hover:text-neon-lime/80 font-medium">
                                Mark all read
                            </button>
                        )}
                    </div>
                    <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-sm text-white/30 italic">
                                No new alerts. System normal.
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`px-4 py-4 hover:bg-white/5 transition-colors duration-200 border-b border-white/5 last:border-0 cursor-pointer ${!notification.is_read ? 'bg-white/[0.02]' : ''}`}
                                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <p className={`text-sm ${!notification.is_read ? 'font-medium text-white' : 'text-white/50'}`}>
                                            {notification.title}
                                        </p>
                                        <span className="text-xs text-white/20 whitespace-nowrap ml-2 font-mono">
                                            {new Date(notification.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-white/40 truncate leading-relaxed">{notification.message}</p>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="border-t border-white/5 px-4 py-3 text-center bg-black/20">
                        <Link href="/dashboard/notifications" className="text-xs font-medium text-white/60 hover:text-white transition-colors">
                            VIEW ALL LOGS
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );

}
