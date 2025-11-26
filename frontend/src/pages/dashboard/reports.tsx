import { useState } from 'react';
import api from '@/lib/axios';
import DashboardLayout from '@/components/layout/dashboard-layout';

export default function ReportsPage() {
    const [loading, setLoading] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState({
        start: '',
        end: ''
    });

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
        {
            id: 'inventory',
            title: 'Inventory Report',
            description: 'Export all inventory items with current stock levels',
            icon: '📦',
            color: 'bg-blue-500'
        },
        {
            id: 'sales',
            title: 'Sales Report',
            description: 'Export sales transactions with customer details',
            icon: '💰',
            color: 'bg-green-500'
        },
        {
            id: 'purchases',
            title: 'Purchases Report',
            description: 'Export purchase transactions with supplier details',
            icon: '🛒',
            color: 'bg-purple-500'
        },
        {
            id: 'expenses',
            title: 'Expenses Report',
            description: 'Export all expenses by category',
            icon: '💸',
            color: 'bg-red-500'
        }
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Reports & Analytics</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Download CSV reports and view business analytics
                    </p>
                </div>

                {/* Date Range Filter */}
                <div className="bg-white shadow rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Date Range Filter (Optional)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                            <input
                                type="date"
                                className="w-full border border-gray-300 rounded px-3 py-2"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">End Date</label>
                            <input
                                type="date"
                                className="w-full border border-gray-300 rounded px-3 py-2"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        Leave empty to export all data. Date range applies to Sales, Purchases, and Expenses reports.
                    </p>
                </div>

                {/* CSV Export Reports */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">CSV Export Reports</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {reports.map((report) => (
                            <div key={report.id} className="bg-white shadow rounded-lg overflow-hidden">
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
                                        className={`w-full ${loading === report.id ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white px-4 py-2 rounded transition-colors`}
                                    >
                                        {loading === report.id ? 'Downloading...' : 'Download CSV'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Analytics Cards */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Analytics</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <AnalyticsCard
                            title="Sales Analytics"
                            description="View daily sales trends"
                            endpoint="/reports/analytics/sales"
                            icon="📊"
                        />
                        <AnalyticsCard
                            title="Inventory Valuation"
                            description="Total inventory worth"
                            endpoint="/reports/analytics/inventory-valuation"
                            icon="💎"
                        />
                        <AnalyticsCard
                            title="Profit & Loss"
                            description="Financial performance"
                            endpoint="/reports/analytics/profit-loss"
                            icon="📈"
                        />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

function AnalyticsCard({ title, description, endpoint, icon }: any) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await api.get(endpoint);
            setData(response.data);
        } catch (error) {
            alert('Failed to fetch analytics');
        } finally {
            setLoading(false);
        }
    };

    const renderData = () => {
        if (!data) return null;

        // Inventory Valuation
        if (data.selling_value !== undefined) {
            return (
                <div className="mt-3 space-y-2">
                    <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Purchase Value:</span>
                        <span className="text-sm font-semibold">₹{data.purchase_value.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Selling Value:</span>
                        <span className="text-sm font-semibold">₹{data.selling_value.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Items:</span>
                        <span className="text-sm font-semibold">{data.total_items}</span>
                    </div>
                </div>
            );
        }

        // Profit & Loss
        if (data.revenue !== undefined) {
            return (
                <div className="mt-3 space-y-2">
                    <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Revenue:</span>
                        <span className="text-sm font-semibold text-green-600">₹{data.revenue.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm text-gray-600">COGS:</span>
                        <span className="text-sm font-semibold text-red-600">₹{data.cost_of_goods_sold.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Expenses:</span>
                        <span className="text-sm font-semibold text-red-600">₹{data.operating_expenses.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                        <span className="text-sm font-bold text-gray-900">Net Profit:</span>
                        <span className={`text-sm font-bold ${data.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₹{data.net_profit.toLocaleString('en-IN')}
                        </span>
                    </div>
                </div>
            );
        }

        // Sales Analytics
        if (data.daily_sales) {
            const totalSales = data.daily_sales.reduce((sum: number, day: any) => sum + day.total, 0);
            const totalCount = data.daily_sales.reduce((sum: number, day: any) => sum + day.count, 0);
            return (
                <div className="mt-3 space-y-2">
                    <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Sales:</span>
                        <span className="text-sm font-semibold">₹{totalSales.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Transactions:</span>
                        <span className="text-sm font-semibold">{totalCount}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Avg per Day:</span>
                        <span className="text-sm font-semibold">
                            ₹{(totalSales / (data.daily_sales.length || 1)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </span>
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="bg-white shadow rounded-lg p-5">
            <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">{icon}</span>
                <h3 className="text-md font-semibold text-gray-900">{title}</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">{description}</p>

            {!data ? (
                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm"
                >
                    {loading ? 'Loading...' : 'View Analytics'}
                </button>
            ) : (
                <>
                    {renderData()}
                    <button
                        onClick={fetchData}
                        className="w-full mt-3 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm"
                    >
                        Refresh
                    </button>
                </>
            )}
        </div>
    );
}
