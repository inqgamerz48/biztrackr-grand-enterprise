import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { useRouter } from 'next/router';
import PageTransition from '@/components/ui/PageTransition';
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
        <div className="flex h-screen bg-gray-100">
            <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <Header setSidebarOpen={setSidebarOpen} />

                <motion.main
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100"
                >
                    <div className="container mx-auto px-6 py-8">
                        <PageTransition>
                            {children}
                        </PageTransition>
                    </div>
                </motion.main>
            </div>
        </div>
    );
}
