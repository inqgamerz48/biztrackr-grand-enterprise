import { Search, Bell, Menu } from 'lucide-react';
import NotificationBell from '@/components/common/NotificationBell';

interface HeaderProps {
    setSidebarOpen: (open: boolean) => void;
}

export default function Header({ setSidebarOpen }: HeaderProps) {
    return (
        <header className="sticky top-0 z-40 bg-background border-b border-border">
            <div className="px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-4 flex-1 max-w-xl">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="md:hidden p-2 rounded-lg hover:bg-muted text-foreground"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="relative group flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search anything..."
                            className="w-full bg-muted/50 border border-border rounded-xl py-2.5 pl-10 pr-4 text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/20 transition-all"
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
