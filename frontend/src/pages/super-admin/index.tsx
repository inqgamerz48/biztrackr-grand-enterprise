import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import api from '@/lib/axios';
import { useRouter } from 'next/router';

interface Tenant {
    id: number;
    name: string;
    plan: string;
    subscription_status: string;
    created_at: string;
    user_count: number;
}

export default function SuperAdminDashboard() {
    const { user: currentUser } = useAuth();
    const router = useRouter();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (currentUser && !currentUser.is_superuser) {
            router.push('/dashboard');
            return;
        }
        fetchTenants();
    }, [currentUser]);

    const fetchTenants = async () => {
        try {
            const res = await api.get('/admin/tenants');
            setTenants(res.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to fetch tenants');
        } finally {
            setLoading(false);
        }
    };

    const toggleTenantStatus = async (tenantId: number, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
        try {
            await api.put(`/admin/tenants/${tenantId}/status`, { subscription_status: newStatus });
            setTenants(tenants.map(t => t.id === tenantId ? { ...t, subscription_status: newStatus } : t));
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to update status');
        }
    };

    if (loading) return <div className="p-8">Loading Super Admin Dashboard...</div>;

    return (
        <div className="p-8 bg-black min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-white">Super Admin Dashboard</h1>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="px-4 py-2 bg-black border border-white/20 rounded-md shadow-none text-sm font-medium text-white hover:bg-white/10"
                    >
                        Back to App
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-white/10 border border-white/20 rounded-md text-white">
                        {error}
                    </div>
                )}

                <div className="bg-black border border-white/20 shadow-none overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-white/20">
                        <h3 className="text-lg leading-6 font-medium text-white">Registered Tenants</h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-400">Manage all companies on the platform.</p>
                    </div>
                    <table className="min-w-full divide-y divide-white/10">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Company</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Plan</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Users</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Joined</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-black divide-y divide-white/10">
                            {tenants.map((tenant) => (
                                <tr key={tenant.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-white">{tenant.name}</div>
                                        <div className="text-sm text-gray-400">ID: {tenant.id}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-white text-black border border-white">
                                            {tenant.plan.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                        {tenant.user_count}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tenant.subscription_status === 'active' ? 'bg-white text-black border border-white' : 'bg-black text-white border border-white'
                                            }`}>
                                            {tenant.subscription_status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                        {new Date(tenant.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => toggleTenantStatus(tenant.id, tenant.subscription_status)}
                                            className={`text-white hover:text-gray-300 underline ${tenant.id === currentUser?.tenant_id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            disabled={tenant.id === currentUser?.tenant_id}
                                        >
                                            {tenant.subscription_status === 'active' ? 'Suspend' : 'Activate'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
