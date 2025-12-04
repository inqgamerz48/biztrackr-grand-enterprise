import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { useTheme } from '@/context/ThemeContext';
import { TrendingUp, TrendingDown, DollarSign, Package, CreditCard, Activity } from 'lucide-react';

export default function ReportsPage() {
    const { theme } = useTheme();
    const [loading, setLoading] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState({
        start: '',
        end: ''
    });

    // Analytics Data
    const [salesData, setSalesData] = useState<any>(null);
    const [inventoryData, setInventoryData] = useState<any>(null);
    const [expenseData, setExpenseData] = useState<any>(null);
    const [profitLossData, setProfitLossData] = useState<any>(null);
    const [taxData, setTaxData] = useState<any>(null);
    const [chartsLoading, setChartsLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, [dateRange]);

    const fetchAnalytics = async () => {
        setChartsLoading(true);
        try {
            const params: any = {};
            if (dateRange.start) params.start_date = new Date(dateRange.start).toISOString();
            if (dateRange.end) params.end_date = new Date(dateRange.end).toISOString();

            const [salesRes, invRes, expRes, plRes, taxRes] = await Promise.all([
                api.get('/reports/analytics/sales', { params: { days: 30 } }),
                api.get('/reports/analytics/inventory-by-category'),
                api.get('/reports/analytics/expenses-by-category', { params }),
                api.get('/reports/analytics/profit-loss', { params }),
                api.get('/tax/tax', { params: { start_date: dateRange.start, end_date: dateRange.end } })
            ]);

            setSalesData(salesRes.data);
            setInventoryData(invRes.data);
            setExpenseData(expRes.data);
            setProfitLossData(plRes.data);
            setTaxData(taxRes.data);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setChartsLoading(false);
        }
    };

    const downloadCSV = async (reportType: string) => {
        setLoading(reportType);
        try {
            const params: any = {};
            if (dateRange.start) params.start_date = new Date(dateRange.start).toISOString();
            if (dateRange.end) params.end_date = new Date(dateRange.end).toISOString();

            const response = await api.get(`/reports/${reportType}/export`, {
                params,
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            alert('Failed to download report');
        } finally {
            setLoading(null);
        }
    };

    const reports = [
        { id: 'inventory', title: 'Inventory Report', description: 'Export all inventory items', icon: '📦', color: 'bg-primary/10' },
        { id: 'sales', title: 'Sales Report', description: 'Export sales transactions', icon: '💰', color: 'bg-primary/10' },
        { id: 'purchases', title: 'Purchases Report', description: 'Export purchase transactions', icon: '🛒', color: 'bg-primary/10' },
        { id: 'expenses', title: 'Expenses Report', description: 'Export all expenses', icon: '💸', color: 'bg-primary/10' }
    ];

    // Helper to calculate total from array data
    const calculateTotal = (data: any[], key: string) => {
        if (!data) return 0;
        return data.reduce((acc: number, item: any) => acc + (item[key] || 0), 0);
    };

    return (
        <DashboardLayout>
            <div className="space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">Reports & Analytics</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Detailed financial and operational insights</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <input
                            type="date"
                            className="flex-1 sm:flex-none bg-background text-foreground border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-primary focus:border-primary"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        />
                        <span className="self-center text-muted-foreground">-</span>
                        <input
                            type="date"
                            className="flex-1 sm:flex-none bg-background text-foreground border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-primary focus:border-primary"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        />
                    </div>
                </div>

                {/* Analytics Cards Grid */}
                {chartsLoading ? (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">Loading analytics...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Sales Summary */}
                        <div className="bg-card border border-border p-6 rounded-lg shadow-none">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-foreground">Total Sales</h3>
                                <div className="p-2 bg-primary/10 rounded-full text-primary">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-foreground mb-1">
                                ₹{calculateTotal(salesData?.daily_sales, 'total').toLocaleString('en-IN')}
                            </div>
                            <p className="text-sm text-muted-foreground">Total revenue for selected period</p>
                        </div>

                        {/* Inventory Value */}
                        <div className="bg-card border border-border p-6 rounded-lg shadow-none">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-foreground">Inventory Value</h3>
                                <div className="p-2 bg-blue-500/10 rounded-full text-blue-500">
                                    <Package className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-foreground mb-1">
                                ₹{calculateTotal(inventoryData, 'value').toLocaleString('en-IN')}
                            </div>
                            <p className="text-sm text-muted-foreground">Total value of current stock</p>
                            <div className="mt-4 space-y-2">
                                {(inventoryData || []).slice(0, 3).map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">{item.name}</span>
                                        <span className="font-medium">₹{item.value.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Expenses Summary */}
                        <div className="bg-card border border-border p-6 rounded-lg shadow-none">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-foreground">Total Expenses</h3>
                                <div className="p-2 bg-red-500/10 rounded-full text-red-500">
                                    <CreditCard className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-foreground mb-1">
                                ₹{calculateTotal(expenseData, 'value').toLocaleString('en-IN')}
                            </div>
                            <p className="text-sm text-muted-foreground">Operational costs</p>
                            <div className="mt-4 space-y-2">
                                {(expenseData || []).slice(0, 3).map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">{item.name}</span>
                                        <span className="font-medium">₹{item.value.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Profit & Loss Summary */}
                        {profitLossData && (
                            <div className="bg-card border border-border p-6 rounded-lg shadow-none md:col-span-2 lg:col-span-3">
                                <h3 className="text-lg font-semibold mb-4 text-foreground">Profit & Loss Overview</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-4 bg-muted/50 rounded-lg border border-border">
                                        <p className="text-sm text-muted-foreground mb-1">Revenue</p>
                                        <p className="text-xl font-bold text-foreground">₹{profitLossData.revenue.toLocaleString('en-IN')}</p>
                                    </div>
                                    <div className="p-4 bg-muted/50 rounded-lg border border-border">
                                        <p className="text-sm text-muted-foreground mb-1">COGS</p>
                                        <p className="text-xl font-bold text-foreground">₹{profitLossData.cost_of_goods_sold.toLocaleString('en-IN')}</p>
                                    </div>
                                    <div className="p-4 bg-muted/50 rounded-lg border border-border">
                                        <p className="text-sm text-muted-foreground mb-1">Expenses</p>
                                        <p className="text-xl font-bold text-foreground">₹{profitLossData.operating_expenses.toLocaleString('en-IN')}</p>
                                    </div>
                                    <div className={`p-4 rounded-lg border ${profitLossData.net_profit >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                                        <p className="text-sm text-muted-foreground mb-1">Net Profit</p>
                                        <p className={`text-xl font-bold ${profitLossData.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            ₹{profitLossData.net_profit.toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tax Report Card */}
                        {taxData && (
                            <div className="bg-card border border-border p-6 rounded-lg shadow-none md:col-span-2 lg:col-span-3">
                                <h3 className="text-lg font-semibold mb-4 text-foreground">Tax Summary</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Input Tax (Purchases)</p>
                                            <p className="text-xl font-bold text-foreground mt-1">₹{taxData.input_tax.toLocaleString('en-IN')}</p>
                                        </div>
                                        <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                            <TrendingDown className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Output Tax (Sales)</p>
                                            <p className="text-xl font-bold text-foreground mt-1">₹{taxData.output_tax.toLocaleString('en-IN')}</p>
                                        </div>
                                        <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                                            <TrendingUp className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Net Payable</p>
                                            <p className="text-xl font-bold text-foreground mt-1">₹{taxData.net_tax_payable.toLocaleString('en-IN')}</p>
                                        </div>
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <Activity className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* CSV Exports */}
                <div>
                    <h2 className="text-lg font-semibold text-foreground mb-4">Data Exports</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {reports.map((report) => (
                            <div key={report.id} className="bg-card border border-border shadow-none rounded-lg overflow-hidden hover:border-primary/40 transition-colors">
                                <div className={`${report.color} h-2`}></div>
                                <div className="p-5">
                                    <div className="flex items-center mb-3">
                                        <span className="text-3xl mr-3">{report.icon}</span>
                                        <h3 className="text-lg font-semibold text-foreground">{report.title}</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
                                    <button
                                        onClick={() => downloadCSV(report.id)}
                                        disabled={loading === report.id}
                                        className={`w-full ${loading === report.id ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground hover:opacity-90'} px-4 py-2 rounded transition-colors text-sm font-medium border border-transparent`}
                                    >
                                        {loading === report.id ? 'Downloading...' : 'Download CSV'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
