import { Search, Bell, Menu } from 'lucide-react';
import NotificationBell from '@/components/common/NotificationBell';

interface HeaderProps {
    setSidebarOpen: (open: boolean) => void;
}

export default function Header({ setSidebarOpen }: HeaderProps) {
    return (
        <header className="sticky top-0 z-40 bg-obsidian/80 backdrop-blur-xl border-b border-white/5">
            <div className="px-8 py-5 flex justify-between items-center">
                <div className="flex items-center gap-4 flex-1 max-w-xl">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="md:hidden p-2 rounded-lg hover:bg-white/5 text-white"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="relative group flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-neon-lime transition-colors w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search system..."
                            className="w-full bg-charcoal border border-white/5 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-neon-lime/50 focus:ring-1 focus:ring-neon-lime/50 transition-all text-sm font-medium"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-6 ml-4">
                    <NotificationBell />
                </div>
            </div>
        </header>
    );
}
