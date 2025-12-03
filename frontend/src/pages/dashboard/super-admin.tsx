import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layout/dashboard-layout';
import api from '@/lib/axios';
import { useAuth } from '@/hooks/use-auth';
import { motion } from 'framer-motion';
import { Check, X, Building, Users, Clock } from 'lucide-react';

interface Tenant {
    id: number;
    name: string;
    plan: string;
    subscription_status: string;
    created_at: string;
    user_count: number;
}

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
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [requests, setRequests] = useState<UpgradeRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading) {
            if (!user || (!user.is_superuser && user.role !== 'super_admin')) {
                router.push('/dashboard');
                return;
            }
            fetchData();
        }
    }, [user, authLoading]);

    const fetchData = async () => {
        try {
            const [tenantsRes, requestsRes] = await Promise.all([
                api.get('/super-admin/tenants'),
                api.get('/super-admin/upgrade-requests?status=pending')
            ]);
            setTenants(tenantsRes.data);
            setRequests(requestsRes.data);
        } catch (error) {
            console.error("Failed to fetch admin data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: number) => {
        if (!confirm("Approve this upgrade request?")) return;
        try {
            await api.post(`/super-admin/approve/${id}`);
            fetchData(); // Refresh
        } catch (error) {
            alert("Failed to approve");
        }
    };

    const handleReject = async (id: number) => {
        if (!confirm("Reject this upgrade request?")) return;
        try {
            await api.post(`/super-admin/reject/${id}`);
            fetchData(); // Refresh
        } catch (error) {
            alert("Failed to reject");
        }
    };

    if (authLoading || loading) return <DashboardLayout><div className="p-8 text-white">Loading...</div></DashboardLayout>;

    return (
        <DashboardLayout>
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white">Super Admin Dashboard</h1>
                    <span className="px-3 py-1 bg-white/10 text-white border border-white/20 rounded-full text-sm font-medium">
                        Super Admin Access
                    </span>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-black p-6 rounded-lg shadow-none border border-white/20">
                        <div className="flex items-center">
                            <div className="p-3 rounded-full bg-white/10 text-white">
                                <Building className="w-6 h-6" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-400">Total Tenants</p>
                                <p className="text-2xl font-semibold text-white">{tenants.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-black p-6 rounded-lg shadow-none border border-white/20">
                        <div className="flex items-center">
                            <div className="p-3 rounded-full bg-white/10 text-white">
                                <Users className="w-6 h-6" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-400">Total Users</p>
                                <p className="text-2xl font-semibold text-white">
                                    {tenants.reduce((acc, t) => acc + t.user_count, 0)}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-black p-6 rounded-lg shadow-none border border-white/20">
                        <div className="flex items-center">
                            <div className="p-3 rounded-full bg-white/10 text-white">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-400">Pending Requests</p>
                                <p className="text-2xl font-semibold text-white">{requests.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pending Upgrade Requests */}
                {requests.length > 0 && (
                    <div className="bg-black rounded-lg border border-white/20 shadow-none overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/20">
                            <h2 className="text-lg font-medium text-white">Pending Upgrade Requests</h2>
                        </div>
                        <ul className="divide-y divide-white/10">
                            {requests.map((req) => (
                                <li key={req.id} className="p-6 hover:bg-white/5 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-md font-medium text-white">
                                                    Request #{req.id} - {req.plan_requested.toUpperCase()} Plan
                                                </h3>
                                                <span className="text-sm text-gray-400">
                                                    {new Date(req.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
                                                <p><strong>User ID:</strong> {req.user_id}</p>
                                                <p><strong>Payment Ref:</strong> {req.payment_ref}</p>
                                            </div>
                                            {req.screenshot_url && (
                                                <div className="mt-4">
                                                    <p className="text-xs font-medium text-gray-400 mb-1">Payment Screenshot:</p>
                                                    <a href={req.screenshot_url} target="_blank" rel="noopener noreferrer">
                                                        <img
                                                            src={req.screenshot_url}
                                                            alt="Payment Proof"
                                                            className="h-32 object-cover rounded border border-white/20 hover:opacity-75 transition-opacity"
                                                        />
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                        <div className="ml-6 flex flex-col space-y-2">
                                            <button
                                                onClick={() => handleApprove(req.id)}
                                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-black bg-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
                                            >
                                                <Check className="w-4 h-4 mr-2" />
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleReject(req.id)}
                                                className="inline-flex items-center px-3 py-2 border border-white/20 text-sm leading-4 font-medium rounded-md text-white bg-black hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
                                            >
                                                <X className="w-4 h-4 mr-2" />
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Tenants List */}
                <div className="bg-black rounded-lg border border-white/20 shadow-none overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/20">
                        <h2 className="text-lg font-medium text-white">All Tenants</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-white/10">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Plan</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Users</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Created</th>
                                </tr>
                            </thead>
                            <tbody className="bg-black divide-y divide-white/10">
                                {tenants.map((tenant) => (
                                    <tr key={tenant.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">#{tenant.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{tenant.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-white/10 text-white border border-white/20`}>
                                                {tenant.plan.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-white/10 text-white border border-white/20`}>
                                                {tenant.subscription_status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{tenant.user_count}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                            {new Date(tenant.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
