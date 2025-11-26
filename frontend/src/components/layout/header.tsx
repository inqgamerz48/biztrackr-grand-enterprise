import NotificationBell from '@/components/common/NotificationBell';
import { Search, Bell } from 'lucide-react';

export default function Header() {
    return (
        <header className="sticky top-0 z-40 glass border-b border-slate-200/50">
            <div className="px-6 py-4 flex justify-between items-center">
                <div className="flex-1 max-w-xl">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search anything..."
                            className="w-full bg-slate-100/50 border-none rounded-xl py-2.5 pl-10 pr-4 text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
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
