import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Download } from 'lucide-react';

interface AgingRecord {
    customer_name: string;
    total_due: number;
    "0-30": number;
    "31-60": number;
    "61-90": number;
    "90+": number;
}

interface AgingSummary {
    total_receivables: number;
    customer_count: number;
}

export default function AgingPage() {
    const [records, setRecords] = useState<AgingRecord[]>([]);
    const [summary, setSummary] = useState<AgingSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAgingReport();
    }, []);

    const fetchAgingReport = async () => {
        try {
            const res = await api.get('/aging/receivables');
            setRecords(res.data.details);
            setSummary(res.data.summary);
        } catch (error) {
            console.error('Failed to fetch aging report', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    return (
        <DashboardLayout>
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Accounts Receivable Aging</h1>
                        <p className="mt-1 text-sm text-gray-600">Track unpaid invoices by overdue duration.</p>
                    </div>
                    <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <dt className="text-sm font-medium text-gray-500 truncate">Total Receivables</dt>
                            <dd className="mt-1 text-3xl font-semibold text-gray-900">
                                {summary ? formatCurrency(summary.total_receivables) : '-'}
                            </dd>
                        </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <dt className="text-sm font-medium text-gray-500 truncate">Customers Owing</dt>
                            <dd className="mt-1 text-3xl font-semibold text-gray-900">
                                {summary ? summary.customer_count : '-'}
                            </dd>
                        </div>
                    </div>
                </div>

                {/* Aging Table */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Aging Details</h3>
                    </div>
                    <div className="border-t border-gray-200">
                        {loading ? (
                            <div className="p-6 text-center text-gray-500">Loading report...</div>
                        ) : records.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">No outstanding receivables found.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Due</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">0-30 Days</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">31-60 Days</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">61-90 Days</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">90+ Days</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {records.map((record, idx) => (
                                            <tr key={idx}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {record.customer_name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                                                    {formatCurrency(record.total_due)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                                    {formatCurrency(record["0-30"])}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-yellow-600">
                                                    {formatCurrency(record["31-60"])}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600">
                                                    {formatCurrency(record["61-90"])}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-medium">
                                                    {formatCurrency(record["90+"])}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
