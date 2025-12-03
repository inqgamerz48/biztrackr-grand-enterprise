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
                <h1 className="text-2xl font-bold text-white">Super Admin Dashboard</h1>

                <div className="bg-black border border-white/20 shadow-none overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-white">Pending Upgrade Requests</h3>
                    </div>
                    <div className="border-t border-white/20">
                        {loading ? (
                            <p className="p-4 text-gray-400">Loading...</p>
                        ) : requests.length === 0 ? (
                            <p className="p-4 text-gray-400">No pending requests.</p>
                        ) : (
                            <ul className="divide-y divide-white/10">
                                {requests.map((req) => (
                                    <li key={req.id} className="px-4 py-4 sm:px-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">
                                                    Request #{req.id} - Plan: {req.plan_requested.toUpperCase()}
                                                </p>
                                                <p className="text-sm text-gray-400">
                                                    User ID: {req.user_id} | Company ID: {req.company_id}
                                                </p>
                                                <p className="text-sm text-gray-400">
                                                    Ref: {req.payment_ref}
                                                </p>
                                                {req.screenshot_url && (
                                                    <a href={req.screenshot_url} target="_blank" rel="noreferrer" className="text-sm text-white underline hover:text-gray-300">
                                                        View Screenshot
                                                    </a>
                                                )}
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleAction(req.id, 'approve')}
                                                    className="inline-flex items-center px-3 py-1.5 border border-white text-xs font-medium rounded-md text-black bg-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleAction(req.id, 'reject')}
                                                    className="inline-flex items-center px-3 py-1.5 border border-white text-xs font-medium rounded-md text-white bg-black hover:bg-white hover:text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
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
