import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { motion } from 'framer-motion';
import { DollarSign, Package, TrendingUp, Sparkles, ArrowUpRight, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
    sales_today: number;
    sales_yesterday: number;
    sales_trend: number;
    total_inventory: number;
    low_stock_items: number;
}

export default function DashboardPage() {
    const [insights, setInsights] = useState([]);
    const [stats, setStats] = useState<DashboardStats>({
        sales_today: 0,
        sales_yesterday: 0,
        sales_trend: 0,
        total_inventory: 0,
        low_stock_items: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/ai/insights');
                setInsights(res.data.insights);
                const statsRes = await api.get('/dashboard/stats');
                setStats(statsRes.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                        <p className="text-gray-400 mt-1">Welcome back, here's what's happening today.</p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/dashboard/reports">
                            <button className="px-4 py-2 bg-black border border-white/20 rounded-xl text-white font-medium hover:bg-white/10 transition-colors shadow-none">
                                Export Report
                            </button>
                        </Link>
                        <Link href="/dashboard/sales">
                            <button className="px-4 py-2 bg-white text-black rounded-xl font-medium hover:bg-gray-200 transition-colors shadow-lg shadow-white/10">
                                New Sale
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Stats Grid */}
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                >
                    {/* Card 1 */}
                    <Link href="/dashboard/sales">
                        <motion.div variants={item} className="bg-black border border-white/20 rounded-2xl p-6 relative overflow-hidden group cursor-pointer hover:border-white/40 transition-colors">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <DollarSign className="w-24 h-24 text-white" />
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/10 text-white rounded-xl">
                                    <DollarSign className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-400">Total Sales Today</p>
                                    <h3 className="text-2xl font-bold text-white mt-1">₹{stats.sales_today.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm">
                                <span className={`${stats.sales_trend >= 0 ? 'text-white bg-white/10 border border-white/20' : 'text-white bg-white/10 border border-white/20'} flex items-center font-medium px-2 py-0.5 rounded-lg`}>
                                    <TrendingUp className={`w-4 h-4 mr-1 ${stats.sales_trend < 0 ? 'rotate-180' : ''}`} />
                                    {stats.sales_trend > 0 ? '+' : ''}{stats.sales_trend}%
                                </span>
                                <span className="text-gray-500 ml-2">vs yesterday</span>
                            </div>
                        </motion.div>
                    </Link>

                    {/* Card 2 */}
                    <Link href="/dashboard/inventory">
                        <motion.div variants={item} className="bg-black border border-white/20 rounded-2xl p-6 relative overflow-hidden group cursor-pointer hover:border-white/40 transition-colors">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Package className="w-24 h-24 text-white" />
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/10 text-white rounded-xl">
                                    <Package className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-400">Active Inventory</p>
                                    <h3 className="text-2xl font-bold text-white mt-1">{stats.total_inventory} Items</h3>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm">
                                <span className={`${stats.low_stock_items > 0 ? 'text-white bg-white/10 border border-white/20' : 'text-white bg-white/10 border border-white/20'} flex items-center font-medium px-2 py-0.5 rounded-lg`}>
                                    {stats.low_stock_items > 0 ? <AlertTriangle className="w-4 h-4 mr-1" /> : <ArrowUpRight className="w-4 h-4 mr-1" />}
                                    {stats.low_stock_items > 0 ? `${stats.low_stock_items} Low Stock` : 'Healthy Stock'}
                                </span>
                                <span className="text-gray-500 ml-2">status</span>
                            </div>
                        </motion.div>
                    </Link>

                    {/* Card 3 - AI Insight Summary */}
                    <motion.div variants={item} className="bg-white text-black rounded-2xl p-6 relative overflow-hidden group border border-white/20">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Sparkles className="w-24 h-24 text-black" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles className="w-5 h-5 text-black" />
                                <span className="font-medium text-gray-600">AI Insight</span>
                            </div>
                            <h3 className="text-lg font-semibold leading-snug mb-2">
                                Sales are trending up!
                            </h3>
                            <p className="text-gray-600 text-sm opacity-90">
                                Consider restocking "Wireless Headphones" as demand is increasing.
                            </p>
                        </div>
                    </motion.div>
                </motion.div>

                {/* AI Insights Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-black border border-white/20 rounded-2xl overflow-hidden"
                >
                    <div className="p-6 border-b border-white/10 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-white" />
                            Detailed AI Insights
                        </h2>
                        <Link href="/dashboard/reports">
                            <button className="text-sm text-white hover:text-gray-300 font-medium underline">
                                View All
                            </button>
                        </Link>
                    </div>
                    <div className="divide-y divide-white/10">
                        {loading ? (
                            <div className="p-8 text-center text-gray-400">
                                <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
                                Analyzing data...
                            </div>
                        ) : (
                            insights.length > 0 ? (
                                insights.map((insight, idx) => (
                                    <div key={idx} className="p-6 hover:bg-white/5 transition-colors flex gap-4">
                                        <div className="flex-shrink-0 mt-1">
                                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                                <Sparkles className="w-4 h-4 text-white" />
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-white leading-relaxed">{insight}</p>
                                            <p className="text-xs text-gray-500 mt-2">Generated just now</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-gray-400">
                                    No new insights available at the moment.
                                </div>
                            )
                        )}
                    </div>
                </motion.div>
            </div>
        </DashboardLayout>
    );
}
