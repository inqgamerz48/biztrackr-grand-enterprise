import { Search, Bell, Menu } from 'lucide-react';
import NotificationBell from '@/components/common/NotificationBell';

interface HeaderProps {
    setSidebarOpen: (open: boolean) => void;
}

export default function Header({ setSidebarOpen }: HeaderProps) {
    return (
        <header className="sticky top-0 z-40 bg-black border-b border-white/20">
            <div className="px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-4 flex-1 max-w-xl">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="md:hidden p-2 rounded-lg hover:bg-white/10 text-white"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="relative group flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-white transition-colors w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search anything..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-white/20 transition-all"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4 ml-4">
                    <NotificationBell />
                </div>
            </div>
        </header>
    );
}
