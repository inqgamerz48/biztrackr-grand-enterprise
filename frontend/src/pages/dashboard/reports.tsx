import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import DashboardLayout from '@/components/layout/dashboard-layout';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useTheme } from '@/context/ThemeContext';

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

    // Dynamic Chart Colors based on Theme
    const getChartColors = () => {
        switch (theme) {
            case 'light':
                return {
                    grid: '#e5e7eb',
                    text: '#6b7280',
                    tooltipBg: '#ffffff',
                    tooltipText: '#1f2937',
                    primary: '#2563eb',
                    secondary: '#3b82f6',
                    colors: ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe']
                };
            case 'stranger':
                return {
                    grid: '#4b004b',
                    text: '#d1d5db',
                    tooltipBg: '#1a0505',
                    tooltipText: '#ffffff',
                    primary: '#d00000',
                    secondary: '#ff0000',
                    colors: ['#d00000', '#ff0000', '#ff4d4d', '#ff8080', '#ffb3b3']
                };
            case 'christmas':
                return {
                    grid: '#d4a017',
                    text: '#161e19',
                    tooltipBg: '#ffffff',
                    tooltipText: '#161e19',
                    primary: '#0f6a4d',
                    secondary: '#c62828',
                    colors: ['#0f6a4d', '#c62828', '#d4a017', '#1b5e20', '#b71c1c']
                };
            default: // dark
                return {
                    grid: '#333333',
                    text: '#a3a3a3',
                    tooltipBg: '#000000',
                    tooltipText: '#ffffff',
                    primary: '#00e5ff',
                    secondary: '#ffffff',
                    colors: ['#00e5ff', '#ffffff', '#a3a3a3', '#737373', '#404040']
                };
        }
    };

    const chartColors = getChartColors();

    return (
        <DashboardLayout>
            <div className="space-y-8">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">Reports & Analytics</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Visual insights and data exports</p>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="date"
                            className="bg-background text-foreground border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-primary focus:border-primary"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        />
                        <span className="self-center text-muted-foreground">-</span>
                        <input
                            type="date"
                            className="bg-background text-foreground border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-primary focus:border-primary"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        />
                    </div>
                </div>

                {/* Charts Grid */}
                {chartsLoading ? (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">Loading analytics...</div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Sales Trend */}
                        <div className="bg-card border border-border p-6 rounded-lg shadow-none">
                            <h3 className="text-lg font-semibold mb-4 text-foreground">Sales Trend (Last 30 Days)</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={salesData?.daily_sales || []}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                                        <XAxis dataKey="date" tickFormatter={(str) => new Date(str).toLocaleDateString()} stroke={chartColors.text} />
                                        <YAxis stroke={chartColors.text} />
                                        <Tooltip contentStyle={{ backgroundColor: chartColors.tooltipBg, borderColor: chartColors.grid, color: chartColors.tooltipText }} />
                                        <Legend />
                                        <Line type="monotone" dataKey="total" stroke={chartColors.primary} name="Sales (₹)" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Profit & Loss */}
                        <div className="bg-card border border-border p-6 rounded-lg shadow-none">
                            <h3 className="text-lg font-semibold mb-4 text-foreground">Profit & Loss Overview</h3>
                            {profitLossData && (
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={[
                                            { name: 'Revenue', value: profitLossData.revenue },
                                            { name: 'COGS', value: profitLossData.cost_of_goods_sold },
                                            { name: 'Expenses', value: profitLossData.operating_expenses },
                                            { name: 'Net Profit', value: profitLossData.net_profit }
                                        ]}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                                            <XAxis dataKey="name" stroke={chartColors.text} />
                                            <YAxis stroke={chartColors.text} />
                                            <Tooltip contentStyle={{ backgroundColor: chartColors.tooltipBg, borderColor: chartColors.grid, color: chartColors.tooltipText }} />
                                            <Bar dataKey="value" fill={chartColors.primary}>
                                                {
                                                    [
                                                        { name: 'Revenue', value: profitLossData.revenue },
                                                        { name: 'COGS', value: profitLossData.cost_of_goods_sold },
                                                        { name: 'Expenses', value: profitLossData.operating_expenses },
                                                        { name: 'Net Profit', value: profitLossData.net_profit }
                                                    ].map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.value >= 0 ? chartColors.colors[index % chartColors.colors.length] : '#333333'} stroke={entry.value < 0 ? chartColors.primary : 'none'} />
                                                    ))
                                                }
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>

                        {/* Tax Report */}
                        <div className="bg-card border border-border p-6 rounded-lg shadow-none">
                            <h3 className="text-lg font-semibold mb-4 text-foreground">Tax Report</h3>
                            {taxData && (
                                <div className="h-64 flex flex-col justify-center">
                                    <div className="grid grid-cols-3 gap-4 text-center mb-6">
                                        <div className="p-3 bg-muted border border-border rounded">
                                            <p className="text-sm text-muted-foreground">Input Tax (Purchases)</p>
                                            <p className="text-xl font-bold text-foreground">₹{taxData.input_tax.toLocaleString('en-IN')}</p>
                                        </div>
                                        <div className="p-3 bg-muted border border-border rounded">
                                            <p className="text-sm text-muted-foreground">Output Tax (Sales)</p>
                                            <p className="text-xl font-bold text-foreground">₹{taxData.output_tax.toLocaleString('en-IN')}</p>
                                        </div>
                                        <div className="p-3 bg-muted border border-border rounded">
                                            <p className="text-sm text-muted-foreground">Net Payable</p>
                                            <p className={`text-xl font-bold text-foreground`}>
                                                ₹{taxData.net_tax_payable.toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                    </div>
                                    <ResponsiveContainer width="100%" height="50%">
                                        <BarChart layout="vertical" data={[
                                            { name: 'Input Tax', value: taxData.input_tax },
                                            { name: 'Output Tax', value: taxData.output_tax }
                                        ]}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                                            <XAxis type="number" stroke={chartColors.text} />
                                            <YAxis dataKey="name" type="category" width={100} stroke={chartColors.text} />
                                            <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} contentStyle={{ backgroundColor: chartColors.tooltipBg, borderColor: chartColors.grid, color: chartColors.tooltipText }} />
                                            <Bar dataKey="value" fill={chartColors.primary}>
                                                <Cell fill={chartColors.secondary} /> {/* Input */}
                                                <Cell fill={chartColors.primary} /> {/* Output */}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>

                        {/* Inventory by Category */}
                        <div className="bg-card border border-border p-6 rounded-lg shadow-none">
                            <h3 className="text-lg font-semibold mb-4 text-foreground">Inventory Value by Category</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={inventoryData || []}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {(inventoryData || []).map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={chartColors.colors[index % chartColors.colors.length]} stroke={chartColors.tooltipBg} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} contentStyle={{ backgroundColor: chartColors.tooltipBg, borderColor: chartColors.grid, color: chartColors.tooltipText }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Expenses by Category */}
                        <div className="bg-card border border-border p-6 rounded-lg shadow-none">
                            <h3 className="text-lg font-semibold mb-4 text-foreground">Expenses by Category</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={expenseData || []} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                                        <XAxis type="number" stroke={chartColors.text} />
                                        <YAxis dataKey="name" type="category" width={100} stroke={chartColors.text} />
                                        <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} contentStyle={{ backgroundColor: chartColors.tooltipBg, borderColor: chartColors.grid, color: chartColors.tooltipText }} />
                                        <Bar dataKey="value" fill={chartColors.primary} name="Amount (₹)" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
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
