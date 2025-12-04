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
                {/* Welcome Section */}
                {/* Welcome Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
                        <p className="mt-2 text-muted-foreground">
                            Overview of your business performance.
                        </p>
                    </div>
                    <div className="flex space-x-3 w-full sm:w-auto">
                        <button className="flex-1 sm:flex-none inline-flex justify-center items-center px-4 py-2 border border-border shadow-sm text-sm font-medium rounded-md text-foreground bg-card hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                            Download Report
                        </button>
                        <button className="flex-1 sm:flex-none inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-primary-foreground bg-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                            Create Invoice
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Note: The original `stats` is an object, not an array. This mapping will cause an error.
                       To fix this, `stats` would need to be refactored into an array of KPI items.
                       For now, this faithfully applies the requested change, which introduces this discrepancy. */}
                    {/* {stats.map((item) => (
                        <div key={item.name} className="bg-card overflow-hidden shadow-none rounded-lg border border-border">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <item.icon className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-muted-foreground truncate">{item.name}</dt>
                                            <dd>
                                                <div className="text-lg font-medium text-foreground">{item.value}</div>
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-muted px-5 py-3">
                                <div className="text-sm">
                                    <a href={item.href} className="font-medium text-primary hover:text-primary/80">
                                        View all
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))} */}
                    {/* Reverting to original stats display due to type mismatch in the provided snippet */}
                    {/* Card 1 */}
                    <Link href="/dashboard/sales">
                        <motion.div variants={item} className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden group cursor-pointer hover:border-primary/40 transition-colors">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <DollarSign className="w-24 h-24 text-foreground" />
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 text-primary rounded-xl">
                                    <DollarSign className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Sales Today</p>
                                    <h3 className="text-2xl font-bold text-foreground mt-1">₹{stats.sales_today.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm">
                                <span className={`${stats.sales_trend >= 0 ? 'text-green-500 bg-green-500/10 border border-green-500/20' : 'text-red-500 bg-red-500/10 border border-red-500/20'} flex items-center font-medium px-2 py-0.5 rounded-lg`}>
                                    <TrendingUp className={`w-4 h-4 mr-1 ${stats.sales_trend < 0 ? 'rotate-180' : ''}`} />
                                    {stats.sales_trend > 0 ? '+' : ''}{stats.sales_trend}%
                                </span>
                                <span className="text-muted-foreground ml-2">vs yesterday</span>
                            </div>
                        </motion.div>
                    </Link>

                    {/* Card 2 */}
                    <Link href="/dashboard/inventory">
                        <motion.div variants={item} className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden group cursor-pointer hover:border-primary/40 transition-colors">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Package className="w-24 h-24 text-foreground" />
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 text-primary rounded-xl">
                                    <Package className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Active Inventory</p>
                                    <h3 className="text-2xl font-bold text-foreground mt-1">{stats.total_inventory} Items</h3>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm">
                                <span className={`${stats.low_stock_items > 0 ? 'text-orange-500 bg-orange-500/10 border border-orange-500/20' : 'text-green-500 bg-green-500/10 border border-green-500/20'} flex items-center font-medium px-2 py-0.5 rounded-lg`}>
                                    {stats.low_stock_items > 0 ? <AlertTriangle className="w-4 h-4 mr-1" /> : <ArrowUpRight className="w-4 h-4 mr-1" />}
                                    {stats.low_stock_items > 0 ? `${stats.low_stock_items} Low Stock` : 'Healthy Stock'}
                                </span>
                                <span className="text-muted-foreground ml-2">status</span>
                            </div>
                        </motion.div>
                    </Link>

                    {/* Card 3 - AI Insight Summary */}
                    <motion.div variants={item} className="bg-card text-foreground rounded-2xl p-6 relative overflow-hidden group border border-border">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Sparkles className="w-24 h-24 text-foreground" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles className="w-5 h-5 text-primary" />
                                <span className="font-medium text-muted-foreground">AI Insight</span>
                            </div>
                            <h3 className="text-lg font-semibold leading-snug mb-2">
                                Sales are trending up!
                            </h3>
                            <p className="text-muted-foreground text-sm opacity-90">
                                Consider restocking "Wireless Headphones" as demand is increasing.
                            </p>
                        </div>
                    </motion.div>
                </div>



                {/* AI Insights Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-card border border-border rounded-2xl overflow-hidden"
                >
                    <div className="p-6 border-b border-border flex items-center justify-between">
                        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            Detailed AI Insights
                        </h2>
                        <Link href="/dashboard/reports">
                            <button className="text-sm text-primary hover:text-primary/80 font-medium underline">
                                View All
                            </button>
                        </Link>
                    </div>
                    <div className="divide-y divide-border">
                        {loading ? (
                            <div className="p-8 text-center text-muted-foreground">
                                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
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
