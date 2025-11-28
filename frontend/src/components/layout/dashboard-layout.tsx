import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import BizBot from '@/components/BizBot';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="h-screen flex overflow-hidden bg-slate-50">
            <Sidebar />
            <div className="flex flex-col min-w-0 flex-1 overflow-hidden md:ml-72 transition-all duration-300">
                <Header />
                <main className="flex-1 relative overflow-y-auto focus:outline-none scrollbar-hide">
                    <div className="py-8 px-6">
                        <div className="max-w-7xl mx-auto">
                            {children}
                        </div>
                    </div>
                </main>
                <BizBot />
            </div>
        </div>
    );
}
