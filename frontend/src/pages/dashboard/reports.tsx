import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import DashboardLayout from '@/components/layout/dashboard-layout';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#ffffff', '#d4d4d4', '#a3a3a3', '#737373', '#404040', '#171717'];

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
        { id: 'inventory', title: 'Inventory Report', description: 'Export all inventory items', icon: '📦', color: 'bg-white/10' },
        { id: 'sales', title: 'Sales Report', description: 'Export sales transactions', icon: '💰', color: 'bg-white/10' },
        { id: 'purchases', title: 'Purchases Report', description: 'Export purchase transactions', icon: '🛒', color: 'bg-white/10' },
        { id: 'expenses', title: 'Expenses Report', description: 'Export all expenses', icon: '💸', color: 'bg-white/10' }
    ];

    return (
        <DashboardLayout>
            <div className="space-y-8">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-semibold text-white">Reports & Analytics</h1>
                        <p className="mt-1 text-sm text-gray-400">Visual insights and data exports</p>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="date"
                            className="bg-black text-white border border-white/20 rounded px-3 py-2 text-sm focus:outline-none focus:ring-white focus:border-white"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        />
                        <span className="self-center text-gray-400">-</span>
                        <input
                            type="date"
                            className="bg-black text-white border border-white/20 rounded px-3 py-2 text-sm focus:outline-none focus:ring-white focus:border-white"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        />
                    </div>
                </div>

                {/* Charts Grid */}
                {chartsLoading ? (
                    <div className="h-64 flex items-center justify-center text-gray-400">Loading analytics...</div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Sales Trend */}
                        <div className="bg-black border border-white/20 p-6 rounded-lg shadow-none">
                            <h3 className="text-lg font-semibold mb-4 text-white">Sales Trend (Last 30 Days)</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={salesData?.daily_sales || []}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                        <XAxis dataKey="date" tickFormatter={(str) => new Date(str).toLocaleDateString()} stroke="#666" />
                                        <YAxis stroke="#666" />
                                        <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#333', color: '#fff' }} />
                                        <Legend />
                                        <Line type="monotone" dataKey="total" stroke="#ffffff" name="Sales (₹)" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Profit & Loss */}
                        <div className="bg-black border border-white/20 p-6 rounded-lg shadow-none">
                            <h3 className="text-lg font-semibold mb-4 text-white">Profit & Loss Overview</h3>
                            {profitLossData && (
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={[
                                            { name: 'Revenue', value: profitLossData.revenue },
                                            { name: 'COGS', value: profitLossData.cost_of_goods_sold },
                                            { name: 'Expenses', value: profitLossData.operating_expenses },
                                            { name: 'Net Profit', value: profitLossData.net_profit }
                                        ]}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                            <XAxis dataKey="name" stroke="#666" />
                                            <YAxis stroke="#666" />
                                            <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#333', color: '#fff' }} />
                                            <Bar dataKey="value" fill="#ffffff">
                                                {
                                                    [
                                                        { name: 'Revenue', value: profitLossData.revenue },
                                                        { name: 'COGS', value: profitLossData.cost_of_goods_sold },
                                                        { name: 'Expenses', value: profitLossData.operating_expenses },
                                                        { name: 'Net Profit', value: profitLossData.net_profit }
                                                    ].map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.value >= 0 ? COLORS[index % COLORS.length] : '#333333'} stroke={entry.value < 0 ? '#ffffff' : 'none'} />
                                                    ))
                                                }
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>

                        {/* Tax Report */}
                        <div className="bg-black border border-white/20 p-6 rounded-lg shadow-none">
                            <h3 className="text-lg font-semibold mb-4 text-white">Tax Report</h3>
                            {taxData && (
                                <div className="h-64 flex flex-col justify-center">
                                    <div className="grid grid-cols-3 gap-4 text-center mb-6">
                                        <div className="p-3 bg-white/5 border border-white/10 rounded">
                                            <p className="text-sm text-gray-400">Input Tax (Purchases)</p>
                                            <p className="text-xl font-bold text-white">₹{taxData.input_tax.toLocaleString('en-IN')}</p>
                                        </div>
                                        <div className="p-3 bg-white/5 border border-white/10 rounded">
                                            <p className="text-sm text-gray-400">Output Tax (Sales)</p>
                                            <p className="text-xl font-bold text-white">₹{taxData.output_tax.toLocaleString('en-IN')}</p>
                                        </div>
                                        <div className="p-3 bg-white/5 border border-white/10 rounded">
                                            <p className="text-sm text-gray-400">Net Payable</p>
                                            <p className={`text-xl font-bold text-white`}>
                                                ₹{taxData.net_tax_payable.toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                    </div>
                                    <ResponsiveContainer width="100%" height="50%">
                                        <BarChart layout="vertical" data={[
                                            { name: 'Input Tax', value: taxData.input_tax },
                                            { name: 'Output Tax', value: taxData.output_tax }
                                        ]}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                            <XAxis type="number" stroke="#666" />
                                            <YAxis dataKey="name" type="category" width={100} stroke="#666" />
                                            <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} contentStyle={{ backgroundColor: '#000', borderColor: '#333', color: '#fff' }} />
                                            <Bar dataKey="value" fill="#8884d8">
                                                <Cell fill="#333333" stroke="#ffffff" /> {/* Input */}
                                                <Cell fill="#ffffff" /> {/* Output */}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>

                        {/* Inventory by Category */}
                        <div className="bg-black border border-white/20 p-6 rounded-lg shadow-none">
                            <h3 className="text-lg font-semibold mb-4 text-white">Inventory Value by Category</h3>
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
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#000" />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} contentStyle={{ backgroundColor: '#000', borderColor: '#333', color: '#fff' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Expenses by Category */}
                        <div className="bg-black border border-white/20 p-6 rounded-lg shadow-none">
                            <h3 className="text-lg font-semibold mb-4 text-white">Expenses by Category</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={expenseData || []} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                        <XAxis type="number" stroke="#666" />
                                        <YAxis dataKey="name" type="category" width={100} stroke="#666" />
                                        <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} contentStyle={{ backgroundColor: '#000', borderColor: '#333', color: '#fff' }} />
                                        <Bar dataKey="value" fill="#ffffff" name="Amount (₹)" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {/* CSV Exports */}
                <div>
                    <h2 className="text-lg font-semibold text-white mb-4">Data Exports</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {reports.map((report) => (
                            <div key={report.id} className="bg-black border border-white/20 shadow-none rounded-lg overflow-hidden hover:border-white/40 transition-colors">
                                <div className={`${report.color} h-2`}></div>
                                <div className="p-5">
                                    <div className="flex items-center mb-3">
                                        <span className="text-3xl mr-3">{report.icon}</span>
                                        <h3 className="text-lg font-semibold text-white">{report.title}</h3>
                                    </div>
                                    <p className="text-sm text-gray-400 mb-4">{report.description}</p>
                                    <button
                                        onClick={() => downloadCSV(report.id)}
                                        disabled={loading === report.id}
                                        className={`w-full ${loading === report.id ? 'bg-white/5 text-gray-400' : 'bg-white text-black hover:bg-gray-200'} px-4 py-2 rounded transition-colors text-sm font-medium border border-white`}
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
