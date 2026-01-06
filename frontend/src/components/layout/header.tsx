import { Search, Bell, Menu } from 'lucide-react';
import NotificationBell from '@/components/common/NotificationBell';

interface HeaderProps {
    setSidebarOpen: (open: boolean) => void;
}

export default function Header({ setSidebarOpen }: HeaderProps) {
    return (
        <header className="sticky top-0 z-40 bg-ink border-b border-border">
            <div className="px-8 py-5 flex justify-between items-center">
                <div className="flex items-center gap-4 flex-1 max-w-xl">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="md:hidden p-2 rounded-none hover:bg-white/5 text-paper"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="relative group flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full bg-[#1C1C1C] border border-transparent focus:border-primary rounded-none py-2.5 pl-10 pr-4 text-paper placeholder-muted-foreground focus:outline-none focus:ring-0 transition-all text-sm font-sans"
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
