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
    LogOut
} from 'lucide-react';

interface NavItem {
    name: string;
    href: string;
    icon: any;
    roles: ('admin' | 'manager' | 'cashier')[];
}

const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'cashier'] },
    { name: 'Sales', href: '/dashboard/sales', icon: ShoppingCart, roles: ['admin', 'manager', 'cashier'] },
    { name: 'Inventory', href: '/dashboard/inventory', icon: Package, roles: ['admin', 'manager', 'cashier'] },
    { name: 'Purchases', href: '/dashboard/purchases', icon: ShoppingBag, roles: ['admin', 'manager'] },
    { name: 'CRM', href: '/dashboard/crm', icon: Users, roles: ['admin', 'manager'] },
    { name: 'Expenses', href: '/dashboard/expenses', icon: Receipt, roles: ['admin', 'manager'] },
    { name: 'Reports', href: '/dashboard/reports', icon: BarChart3, roles: ['admin', 'manager'] },
    { name: 'Team', href: '/dashboard/users', icon: UserCog, roles: ['admin', 'manager'] },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['admin'] },
];

export default function Sidebar() {
    const router = useRouter();
    const pathname = router.pathname;
    const { user, logout } = useAuth();

    // Filter navigation based on user role
    const filteredNavigation = navigation.filter(item => {
        if (!user) return false;
        return item.roles.includes(user.role);
    });

    return (
        <div className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-50">
            <div className="flex-1 flex flex-col min-h-0 bg-slate-900 border-r border-slate-800">
                <div className="flex items-center h-20 flex-shrink-0 px-6 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                            B
                        </div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            BizTracker
                        </h1>
                    </div>
                </div>

                <div className="flex-1 flex flex-col overflow-y-auto py-6 px-4">
                    <nav className="flex-1 space-y-1">
                        {filteredNavigation.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                >
                                    <a className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${isActive
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                        }`}>
                                        <Icon className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'
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
                    <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-white font-medium border border-slate-600">
                                {user.email[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                    {user.email}
                                </p>
                                <p className="text-xs text-slate-500 truncate capitalize">
                                    {user.role}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign Out
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
