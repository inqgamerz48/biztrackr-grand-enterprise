"use client";

import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/use-auth';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    ShoppingBag,
    Users,
    Receipt,
    BarChart3,
    UserCog,
    Settings,
    FileText,
    LogOut,
    Bell,
    Shield,
    TrendingUp,
    Building2
} from 'lucide-react';

interface NavItem {
    name: string;
    href: string;
    icon: any;
    permission: string; // Required permission code
    superAdminOnly?: boolean;
    adminOnly?: boolean;
}

const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'view_dashboard' },
    { name: 'Super Admin', href: '/dashboard/super-admin', icon: Shield, permission: '', superAdminOnly: true },
    { name: 'Company Details', href: '/dashboard/company-details', icon: Building2, permission: '', adminOnly: true },
    { name: 'Sales', href: '/dashboard/sales', icon: ShoppingCart, permission: 'view_sales' },
    { name: 'Inventory', href: '/dashboard/inventory', icon: Package, permission: 'view_inventory' },
    { name: 'Purchases', href: '/dashboard/purchases', icon: ShoppingBag, permission: 'view_inventory' }, // Assuming inventory permission covers purchases for now, or add 'view_purchases'
    { name: 'CRM', href: '/dashboard/crm', icon: Users, permission: 'view_sales' }, // CRM usually linked to sales
    { name: 'Expenses', href: '/dashboard/expenses', icon: Receipt, permission: 'view_reports' }, // Expenses often with reports
    { name: 'Reports', href: '/dashboard/reports', icon: BarChart3, permission: 'view_reports' },

    { name: 'Team', href: '/dashboard/users', icon: UserCog, permission: 'manage_users' },
    { name: 'Activity Logs', href: '/dashboard/activity-logs', icon: FileText, permission: 'view_activity_logs' },
    { name: 'Notifications', href: '/dashboard/notifications', icon: Bell, permission: 'view_dashboard' }, // Everyone with dashboard access
    { name: 'Settings', href: '/dashboard/settings', icon: Settings, permission: 'manage_settings' },
];

interface SidebarProps {
    open: boolean;
    setOpen: (open: boolean) => void;
}

export default function Sidebar({ open, setOpen }: SidebarProps) {
    const router = useRouter();
    const pathname = router.pathname;
    const { user, logout, hasPermission } = useAuth();

    // Filter navigation based on user permissions
    const filteredNavigation = navigation.filter(item => {
        if (!user) return false;
        if (item.superAdminOnly) {
            return user.is_superuser || user.role === 'super_admin';
        }
        if (item.adminOnly) {
            return user.role === 'admin' || user.role === 'super_admin';
        }
        return hasPermission(item.permission);
    });

    return (
        <>
            {/* Mobile overlay */}
            <div
                className={`fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity md:hidden ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setOpen(false)}
            />

            <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-obsidian transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto md:flex md:flex-col ${open ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex-1 flex flex-col min-h-0 bg-obsidian border-r border-white/5 relative">
                    {/* Brand Header */}
                    <div className="flex items-center h-24 flex-shrink-0 px-8 bg-obsidian border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-neon-lime flex items-center justify-center text-obsidian font-bold shadow-[0_0_15px_rgba(204,255,0,0.4)]">
                                B
                            </div>
                            <h1 className="text-xl font-display font-bold text-white tracking-widest uppercase">
                                Biz<span className="text-neon-lime">Trackr</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col overflow-y-auto py-8 px-4">
                        <nav className="flex-1 space-y-2">
                            {filteredNavigation.map((item) => {
                                const isActive = pathname === item.href;
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                    >
                                        <a className={`group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                                            ? 'bg-neon-lime/10 text-neon-lime shadow-[inset_2px_0_0_0_#ccff00]'
                                            : 'text-white/50 hover:bg-white/5 hover:text-white'
                                            }`}>
                                            <Icon className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${isActive ? 'text-neon-lime' : 'text-white/40 group-hover:text-neon-lime'
                                                }`} />
                                            {item.name}
                                        </a>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* User Profile */}
                    {user && (
                        <div className="p-6 border-t border-white/5 bg-obsidian">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-full bg-charcoal flex items-center justify-center text-white font-medium border border-white/10">
                                    {user.email[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">
                                        {user.email}
                                    </p>
                                    <p className="text-xs text-neon-lime truncate capitalize font-mono">
                                        {user.role}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={logout}
                                className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-white/60 bg-white/5 hover:bg-destructive hover:text-white rounded-lg transition-colors border border-white/5"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Initiate Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
