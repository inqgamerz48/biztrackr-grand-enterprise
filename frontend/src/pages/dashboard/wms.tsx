import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '@/lib/axios';
import DashboardLayout from '@/components/layout/dashboard-layout';
import {
    Warehouse, Truck, Package, TrendingUp, AlertTriangle,
    Bot, MapPin, Zap, CheckCircle, Clock, X,
    ArrowUp, ArrowDown, Search, Filter, Download, BarChart3
} from 'lucide-react';

// Interfaces
interface WMSIntelligenceReport {
    generated_at: string;
    warehouse_id: number | null;
    analysis_period_days: number;
    low_stock_alerts: LowStockAlert[];
    reorder_suggestions: ReorderSuggestion[];
    optimal_bin_locations: BinOptimization[];
    anomalies_detected: Anomaly[];
    warehouse_performance: WarehousePerformance;
    action_plan: string[];
}

interface LowStockAlert {
    item_id: number;
    sku: string;
    name: string;
    current_stock: number;
    min_stock: number;
    avg_daily_demand: number;
    days_to_stockout: number;
    status: 'critical' | 'warning';
    reorder_point: number;
    safety_stock: number;
}

interface ReorderSuggestion {
    item_id: number;
    name: string;
    recommended_order_qty: number;
    reorder_immediately: boolean;
    best_supplier_id: number | null;
    estimated_cost_if_delayed: number;
    reasoning: string;
}

interface BinOptimization {
    item_id?: number;
    bin_code?: string;
    recommendation: string;
    reason: string;
    priority: 'high' | 'low';
}

interface Anomaly {
    type: string;
    item_id?: number;
    supplier_id?: number;
    description: string;
    severity: 'high' | 'medium' | 'low';
}

interface WarehousePerformance {
    picking_accuracy_pct: number;
    cycle_count_accuracy_pct: number;
    warehouse_space_utilization_pct: number;
    total_inward_receipts: number;
    total_outward_picks: number;
    successful_picks: number;
    top_fast_moving_items: string[];
    top_slow_moving_items: string[];
    active_bins: number;
    total_bins: number;
}

export default function WMSPage() {
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<WMSIntelligenceReport | null>(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedDays, setSelectedDays] = useState(30);

    useEffect(() => {
        fetchIntelligenceReport();
    }, [selectedDays]);

    const fetchIntelligenceReport = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get(`/wms/intelligence?days_history=${selectedDays}`);
            setReport(res.data);
        } catch (error) {
            console.error('Failed to fetch WMS intelligence:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/40';
            case 'warning': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
            case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
            case 'medium': return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
            case 'low': return 'bg-gray-500/20 text-gray-400 border-gray-500/40';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/40';
        }
    };

    const getPriorityColor = (priority: string) => {
        return priority === 'high'
            ? 'bg-gradient-to-r from-red-600/20 to-orange-600/20 border-red-500/40'
            : 'bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-blue-500/40';
    };

    if (loading && !report) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-screen">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-16 h-16 border-4 border-t-cyan-500 border-r-transparent border-b-cyan-500 border-l-transparent rounded-full"
                    />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 shadow-lg shadow-cyan-500/20">
                                <Warehouse className="text-4xl text-cyan-400 w-10 h-10" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                                    Warehouse Intelligence
                                </h1>
                                <p className="text-gray-400 mt-1 flex items-center gap-2">
                                    <Bot className="text-cyan-500" />
                                    AI-Powered Warehouse Management & Analytics
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <select
                                value={selectedDays}
                                onChange={(e) => setSelectedDays(Number(e.target.value))}
                                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                            >
                                <option value={7}>Last 7 Days</option>
                                <option value={30}>Last 30 Days</option>
                                <option value={60}>Last 60 Days</option>
                                <option value={90}>Last 90 Days</option>
                            </select>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={fetchIntelligenceReport}
                                className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-cyan-500/50 transition-all flex items-center gap-2"
                            >
                                <Zap className="w-4 h-4" />
                                Refresh Report
                            </motion.button>
                        </div>
                    </div>
                </motion.div>

                {/* Performance KPIs */}
                {report && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
                    >
                        <KPICard
                            icon={<CheckCircle />}
                            title="Picking Accuracy"
                            value={`${report.warehouse_performance.picking_accuracy_pct}%`}
                            color="from-green-500 to-emerald-600"
                            trend={report.warehouse_performance.picking_accuracy_pct >= 95 ? 'up' : 'down'}
                        />
                        <KPICard
                            icon={<Package />}
                            title="Space Utilization"
                            value={`${report.warehouse_performance.warehouse_space_utilization_pct.toFixed(1)}%`}
                            color="from-blue-500 to-cyan-600"
                            trend={report.warehouse_performance.warehouse_space_utilization_pct > 70 ? 'up' : 'down'}
                        />
                        <KPICard
                            icon={<Truck />}
                            title="Outward Picks"
                            value={report.warehouse_performance.total_outward_picks.toString()}
                            color="from-purple-500 to-pink-600"
                            subValue={`${selectedDays} days`}
                        />
                        <KPICard
                            icon={<TrendingUp />}
                            title="Inward Receipts"
                            value={report.warehouse_performance.total_inward_receipts.toString()}
                            color="from-orange-500 to-red-600"
                            subValue={`${selectedDays} days`}
                        />
                    </motion.div>
                )}

                {/* Tabs */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mb-6"
                >
                    <div className="flex gap-2 bg-slate-800/50 p-2 rounded-xl border border-slate-700/50 backdrop-blur-sm overflow-x-auto">
                        {[
                            { id: 'overview', label: 'Overview', icon: BarChart3 },
                            { id: 'alerts', label: 'Low Stock Alerts', icon: AlertTriangle },
                            { id: 'reorder', label: 'AI Reorder', icon: Bot },
                            { id: 'bins', label: 'Bin Optimization', icon: MapPin },
                            { id: 'anomalies', label: 'Anomalies', icon: Zap },
                        ].map((tab) => {
                            const IconComponent = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${activeTab === tab.id
                                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
                                        : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                                        }`}
                                >
                                    <IconComponent className="w-5 h-5" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && report && (
                        <OverviewTab report={report} />
                    )}
                    {activeTab === 'alerts' && report && (
                        <LowStockTab alerts={report.low_stock_alerts} getStatusColor={getStatusColor} />
                    )}
                    {activeTab === 'reorder' && report && (
                        <ReorderTab suggestions={report.reorder_suggestions} />
                    )}
                    {activeTab === 'bins' && report && (
                        <BinOptimizationTab optimizations={report.optimal_bin_locations} getPriorityColor={getPriorityColor} />
                    )}
                    {activeTab === 'anomalies' && report && (
                        <AnomaliesTab anomalies={report.anomalies_detected} getStatusColor={getStatusColor} />
                    )}
                </AnimatePresence>
            </div>
        </DashboardLayout>
    );
}

// KPI Card Component
function KPICard({ icon, title, value, color, trend, subValue }: any) {
    return (
        <motion.div
            whileHover={{ scale: 1.03, y: -5 }}
            className={`p-6 rounded-xl bg-gradient-to-br ${color} shadow-2xl border border-white/10 backdrop-blur-sm`}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="text-3xl text-white opacity-80">{icon}</div>
                {trend && (
                    <div className={`text-xl ${trend === 'up' ? 'text-green-300' : 'text-red-300'}`}>
                        {trend === 'up' ? <ArrowUp /> : <ArrowDown />}
                    </div>
                )}
            </div>
            <h3 className="text-white/80 text-sm font-medium mb-1">{title}</h3>
            <p className="text-3xl font-bold text-white">{value}</p>
            {subValue && <p className="text-white/60 text-sm mt-1">{subValue}</p>}
        </motion.div>
    );
}

// Overview Tab
function OverviewTab({ report }: { report: WMSIntelligenceReport }) {
    return (
        <motion.div
            key="overview"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
            {/* Action Plan */}
            <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <Zap className="text-yellow-400" />
                    Action Plan
                </h2>
                <div className="space-y-3">
                    {report.action_plan.map((action, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-start gap-3 p-4 rounded-lg bg-slate-700/30 border border-slate-600/30 hover:border-cyan-500/50 transition-all"
                        >
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold">
                                {idx + 1}
                            </div>
                            <p className="text-gray-300 leading-relaxed">{action}</p>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Performance Summary */}
            <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <BarChart3 className="text-cyan-400" />
                    Performance Summary
                </h2>
                <div className="space-y-4">
                    <PerformanceItem
                        label="Active Bins"
                        value={`${report.warehouse_performance.active_bins} / ${report.warehouse_performance.total_bins}`}
                        icon={<Package />}
                    />
                    <PerformanceItem
                        label="Cycle Count Accuracy"
                        value={`${report.warehouse_performance.cycle_count_accuracy_pct}%`}
                        icon={<CheckCircle />}
                    />
                    <PerformanceItem
                        label="Successful Picks"
                        value={`${report.warehouse_performance.successful_picks} / ${report.warehouse_performance.total_outward_picks}`}
                        icon={<Truck />}
                    />

                    <div className="mt-6 pt-4 border-t border-slate-600/50">
                        <h3 className="text-sm font-semibold text-gray-400 mb-2">Top Fast Moving Items</h3>
                        <div className="flex flex-wrap gap-2">
                            {report.warehouse_performance.top_fast_moving_items.slice(0, 5).map((item, idx) => (
                                <span
                                    key={idx}
                                    className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm border border-green-500/30"
                                >
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function PerformanceItem({ label, value, icon }: any) {
    return (
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
            <div className="flex items-center gap-3">
                <div className="text-cyan-400 text-xl">{icon}</div>
                <span className="text-gray-300">{label}</span>
            </div>
            <span className="text-white font-semibold">{value}</span>
        </div>
    );
}

// Low Stock Tab
function LowStockTab({ alerts, getStatusColor }: { alerts: LowStockAlert[]; getStatusColor: any }) {
    return (
        <motion.div
            key="alerts"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 gap-4"
        >
            {alerts.length === 0 ? (
                <div className="p-12 text-center rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <CheckCircle className="mx-auto text-6xl text-green-400 mb-4 w-16 h-16" />
                    <h3 className="text-2xl font-bold text-white mb-2">All Stock Levels Healthy!</h3>
                    <p className="text-gray-400">No low stock alerts at this time.</p>
                </div>
            ) : (
                alerts.map((alert, idx) => (
                    <motion.div
                        key={alert.item_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`p-6 rounded-xl border backdrop-blur-sm ${getStatusColor(alert.status)}`}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-white">{alert.name}</h3>
                                <p className="text-sm text-gray-400">SKU: {alert.sku}</p>
                            </div>
                            <div className={`px-4 py-2 rounded-lg font-bold uppercase text-sm ${alert.status === 'critical' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-black'
                                }`}>
                                {alert.status}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Metric label="Current Stock" value={alert.current_stock} />
                            <Metric label="Min Stock" value={alert.min_stock} />
                            <Metric label="Days to Stockout" value={alert.days_to_stockout.toFixed(1)} highlight />
                            <Metric label="Avg Daily Demand" value={alert.avg_daily_demand.toFixed(2)} />
                            <Metric label="Reorder Point" value={alert.reorder_point} />
                            <Metric label="Safety Stock" value={alert.safety_stock} />
                        </div>
                    </motion.div>
                ))
            )}
        </motion.div>
    );
}

function Metric({ label, value, highlight }: any) {
    return (
        <div className={`p-3 rounded-lg ${highlight ? 'bg-red-500/20 border border-red-500/40' : 'bg-slate-700/30'}`}>
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className={`text-lg font-bold ${highlight ? 'text-red-400' : 'text-white'}`}>{value}</p>
        </div>
    );
}

// Reorder Tab
function ReorderTab({ suggestions }: { suggestions: ReorderSuggestion[] }) {
    return (
        <motion.div
            key="reorder"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 gap-4"
        >
            {suggestions.map((suggestion, idx) => (
                <motion.div
                    key={suggestion.item_id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`p-6 rounded-xl border backdrop-blur-sm ${suggestion.reorder_immediately
                        ? 'bg-gradient-to-r from-red-600/20 to-orange-600/20 border-red-500/40'
                        : 'bg-slate-800/50 border-slate-700/50'
                        }`}
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-1">{suggestion.name}</h3>
                            <p className="text-gray-400 italic">{suggestion.reasoning}</p>
                        </div>
                        {suggestion.reorder_immediately && (
                            <div className="px-4 py-2 rounded-lg bg-red-500 text-white font-bold text-sm animate-pulse">
                                ORDER NOW
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                        <div className="p-4 rounded-lg bg-slate-700/50">
                            <p className="text-xs text-gray-400 mb-1">Recommended Qty</p>
                            <p className="text-2xl font-bold text-cyan-400">{suggestion.recommended_order_qty}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-700/50">
                            <p className="text-xs text-gray-400 mb-1">Best Supplier ID</p>
                            <p className="text-2xl font-bold text-white">{suggestion.best_supplier_id || 'N/A'}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-700/50">
                            <p className="text-xs text-gray-400 mb-1">Cost if Delayed</p>
                            <p className="text-2xl font-bold text-red-400">${suggestion.estimated_cost_if_delayed}</p>
                        </div>
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
}

// Bin Optimization Tab
function BinOptimizationTab({ optimizations, getPriorityColor }: any) {
    return (
        <motion.div
            key="bins"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
            {optimizations.map((opt: BinOptimization, idx: number) => (
                <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`p-6 rounded-xl border backdrop-blur-sm ${getPriorityColor(opt.priority)}`}
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <MapPin className="text-cyan-400 text-xl" />
                            <h3 className="text-lg font-bold text-white">
                                {opt.bin_code ? `Bin: ${opt.bin_code}` : `Item ID: ${opt.item_id}`}
                            </h3>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${opt.priority === 'high' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
                            }`}>
                            {opt.priority}
                        </span>
                    </div>
                    <p className="text-white font-semibold mb-2">📦 {opt.recommendation}</p>
                    <p className="text-gray-400 text-sm">{opt.reason}</p>
                </motion.div>
            ))}
        </motion.div>
    );
}

// Anomalies Tab
function AnomaliesTab({ anomalies, getStatusColor }: any) {
    return (
        <motion.div
            key="anomalies"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 gap-4"
        >
            {anomalies.length === 0 ? (
                <div className="p-12 text-center rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <CheckCircle className="mx-auto text-6xl text-green-400 mb-4 w-16 h-16" />
                    <h3 className="text-2xl font-bold text-white mb-2">No Anomalies Detected</h3>
                    <p className="text-gray-400">Your warehouse data looks clean and consistent.</p>
                </div>
            ) : (
                anomalies.map((anomaly: Anomaly, idx: number) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`p-6 rounded-xl border backdrop-blur-sm ${getStatusColor(anomaly.severity)}`}
                    >
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 p-3 rounded-lg bg-slate-700/50">
                                <Zap className="text-2xl text-yellow-400" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-bold text-white capitalize">{anomaly.type.replace(/_/g, ' ')}</h3>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(anomaly.severity)}`}>
                                        {anomaly.severity}
                                    </span>
                                </div>
                                <p className="text-gray-300">{anomaly.description}</p>
                                {anomaly.item_id && (
                                    <p className="text-sm text-gray-500 mt-2">Item ID: {anomaly.item_id}</p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))
            )}
        </motion.div>
    );
}
