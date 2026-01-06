import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { useRouter } from 'next/router';

import { motion } from 'framer-motion';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const router = useRouter();

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setSidebarOpen(false);
    }, [router.asPath]);

    return (
        <div className="flex h-screen bg-obsidian text-mist font-sans overflow-hidden">
            <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

            <div className="flex-1 flex flex-col overflow-hidden relative z-0">
                <Header setSidebarOpen={setSidebarOpen} />

                <motion.main
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex-1 overflow-x-hidden overflow-y-auto bg-obsidian scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
                >
                    <div className="container mx-auto px-6 py-8">
                        {children}
                    </div>
                </motion.main>

                {/* Global Grid Overlay for spatial effect */}
                <div className="fixed inset-0 pointer-events-none z-[-1] opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            </div>
        </div>
    );
}
