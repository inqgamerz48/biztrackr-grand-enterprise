import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { motion } from 'framer-motion';

interface UpgradeRequest {
    id: number;
    user_id: number;
    company_id: number;
    plan_requested: string;
    screenshot_url: string;
    payment_ref: string;
    status: string;
    created_at: string;
}

export default function SuperAdminDashboard() {
    const [requests, setRequests] = useState<UpgradeRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await api.get('/super-admin/upgrade-requests');
            setRequests(res.data);
        } catch (error) {
            console.error("Failed to fetch requests", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: number, action: 'approve' | 'reject') => {
        if (!confirm(`Are you sure you want to ${action} this request?`)) return;

        try {
            await api.post(`/super-admin/${action}/${id}`);
            alert(`Request ${action}d successfully`);
            fetchRequests(); // Refresh list
        } catch (error) {
            console.error(`Failed to ${action}`, error);
            alert(`Failed to ${action} request`);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>

                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Pending Upgrade Requests</h3>
                    </div>
                    <div className="border-t border-gray-200">
                        {loading ? (
                            <p className="p-4 text-gray-500">Loading...</p>
                        ) : requests.length === 0 ? (
                            <p className="p-4 text-gray-500">No pending requests.</p>
                        ) : (
                            <ul className="divide-y divide-gray-200">
                                {requests.map((req) => (
                                    <li key={req.id} className="px-4 py-4 sm:px-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-indigo-600 truncate">
                                                    Request #{req.id} - Plan: {req.plan_requested.toUpperCase()}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    User ID: {req.user_id} | Company ID: {req.company_id}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Ref: {req.payment_ref}
                                                </p>
                                                {req.screenshot_url && (
                                                    <a href={req.screenshot_url} target="_blank" rel="noreferrer" className="text-sm text-blue-500 hover:underline">
                                                        View Screenshot
                                                    </a>
                                                )}
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleAction(req.id, 'approve')}
                                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleAction(req.id, 'reject')}
                                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
