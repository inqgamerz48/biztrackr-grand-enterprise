import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import DashboardLayout from '@/components/layout/dashboard-layout';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function ReportsPage() {
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

            const [salesRes, invRes, expRes, plRes] = await Promise.all([
                api.get('/reports/analytics/sales', { params: { days: 30 } }),
                api.get('/reports/analytics/inventory-by-category'),
                api.get('/reports/analytics/expenses-by-category', { params }),
                api.get('/reports/analytics/profit-loss', { params })
            ]);

            setSalesData(salesRes.data);
            setInventoryData(invRes.data);
            setExpenseData(expRes.data);
            setProfitLossData(plRes.data);
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
        { id: 'inventory', title: 'Inventory Report', description: 'Export all inventory items', icon: '📦', color: 'bg-blue-500' },
        { id: 'sales', title: 'Sales Report', description: 'Export sales transactions', icon: '💰', color: 'bg-green-500' },
        { id: 'purchases', title: 'Purchases Report', description: 'Export purchase transactions', icon: '🛒', color: 'bg-purple-500' },
        { id: 'expenses', title: 'Expenses Report', description: 'Export all expenses', icon: '💸', color: 'bg-red-500' }
    ];

    return (
        <DashboardLayout>
            <div className="space-y-8">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Reports & Analytics</h1>
                        <p className="mt-1 text-sm text-gray-600">Visual insights and data exports</p>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="date"
                            className="border border-gray-300 rounded px-3 py-2 text-sm"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        />
                        <span className="self-center text-gray-400">-</span>
                        <input
                            type="date"
                            className="border border-gray-300 rounded px-3 py-2 text-sm"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        />
                    </div>
                </div>

                {/* Charts Grid */}
                {chartsLoading ? (
                    <div className="h-64 flex items-center justify-center text-gray-500">Loading analytics...</div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Sales Trend */}
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold mb-4">Sales Trend (Last 30 Days)</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={salesData?.daily_sales || []}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" tickFormatter={(str) => new Date(str).toLocaleDateString()} />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="total" stroke="#8884d8" name="Sales (₹)" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Profit & Loss */}
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold mb-4">Profit & Loss Overview</h3>
                            {profitLossData && (
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={[
                                            { name: 'Revenue', value: profitLossData.revenue },
                                            { name: 'COGS', value: profitLossData.cost_of_goods_sold },
                                            { name: 'Expenses', value: profitLossData.operating_expenses },
                                            { name: 'Net Profit', value: profitLossData.net_profit }
                                        ]}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="value" fill="#82ca9d">
                                                {
                                                    [
                                                        { name: 'Revenue', value: profitLossData.revenue },
                                                        { name: 'COGS', value: profitLossData.cost_of_goods_sold },
                                                        { name: 'Expenses', value: profitLossData.operating_expenses },
                                                        { name: 'Net Profit', value: profitLossData.net_profit }
                                                    ].map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.value >= 0 ? COLORS[index % COLORS.length] : '#FF0000'} />
                                                    ))
                                                }
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>

                        {/* Inventory by Category */}
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold mb-4">Inventory Value by Category</h3>
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
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Expenses by Category */}
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold mb-4">Expenses by Category</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={expenseData || []} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis dataKey="name" type="category" width={100} />
                                        <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                                        <Bar dataKey="value" fill="#FF8042" name="Amount (₹)" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {/* CSV Exports */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Exports</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {reports.map((report) => (
                            <div key={report.id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                                <div className={`${report.color} h-2`}></div>
                                <div className="p-5">
                                    <div className="flex items-center mb-3">
                                        <span className="text-3xl mr-3">{report.icon}</span>
                                        <h3 className="text-lg font-semibold text-gray-900">{report.title}</h3>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                                    <button
                                        onClick={() => downloadCSV(report.id)}
                                        disabled={loading === report.id}
                                        className={`w-full ${loading === report.id ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white px-4 py-2 rounded transition-colors text-sm font-medium`}
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
