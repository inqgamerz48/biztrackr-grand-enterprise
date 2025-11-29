import React from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import api from '@/lib/axios';
import { Download, Database, FileText, Users } from 'lucide-react';

export default function BackupPage() {
    const handleDownload = async (type: 'inventory' | 'sales' | 'customers') => {
        try {
            const response = await api.get(`/backup/${type}`, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${type}_export.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download backup. Please try again.');
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold tracking-tight">Backup & Export</h1>
                </div>

                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">Export Data</h2>
                    <p className="text-gray-500 mb-6">
                        Download your data in CSV format for backup or analysis.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Inventory Export */}
                        <div className="border rounded-lg p-6 flex flex-col items-center text-center hover:bg-gray-50 transition-colors">
                            <div className="p-3 bg-blue-100 rounded-full mb-4">
                                <Database className="h-6 w-6 text-blue-600" />
                            </div>
                            <h3 className="font-medium text-lg mb-2">Inventory</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Export all items, stock levels, and pricing.
                            </p>
                            <button
                                onClick={() => handleDownload('inventory')}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Download CSV
                            </button>
                        </div>

                        {/* Sales Export */}
                        <div className="border rounded-lg p-6 flex flex-col items-center text-center hover:bg-gray-50 transition-colors">
                            <div className="p-3 bg-green-100 rounded-full mb-4">
                                <FileText className="h-6 w-6 text-green-600" />
                            </div>
                            <h3 className="font-medium text-lg mb-2">Sales History</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Export complete sales records and invoices.
                            </p>
                            <button
                                onClick={() => handleDownload('sales')}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Download CSV
                            </button>
                        </div>

                        {/* Customers Export */}
                        <div className="border rounded-lg p-6 flex flex-col items-center text-center hover:bg-gray-50 transition-colors">
                            <div className="p-3 bg-purple-100 rounded-full mb-4">
                                <Users className="h-6 w-6 text-purple-600" />
                            </div>
                            <h3 className="font-medium text-lg mb-2">Customers</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Export customer details and balances.
                            </p>
                            <button
                                onClick={() => handleDownload('customers')}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Download CSV
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
