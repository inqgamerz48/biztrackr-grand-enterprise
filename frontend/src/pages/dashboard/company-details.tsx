import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Building2, Save, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import api from '@/lib/axios';
import { useRouter } from 'next/router';

export default function CompanyDetailsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [company, setCompany] = useState({
        name: '',
        plan: '',
        subscription_status: '',
        created_at: ''
    });

    useEffect(() => {
        if (!authLoading) {
            if (!user || user.role !== 'admin') {
                router.push('/dashboard');
                return;
            }
            fetchCompanyDetails();
        }
    }, [user, authLoading]);

    const fetchCompanyDetails = async () => {
        try {
            const res = await api.get('/tenants/me');
            setCompany(res.data);
        } catch (error) {
            console.error('Failed to fetch company details', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await api.put('/tenants/me', {
                name: company.name
            });
            setCompany(prev => ({ ...prev, ...res.data }));
            alert('Company details updated successfully');
        } catch (error) {
            console.error('Failed to update company details', error);
            alert('Failed to update details');
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Company Details</h1>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-primary-foreground bg-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                    >
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

                <div className="bg-card border border-border shadow-none rounded-lg overflow-hidden">
                    <div className="p-6 border-b border-border">
                        <div className="flex items-center">
                            <Building2 className="h-6 w-6 text-primary mr-3" />
                            <h2 className="text-lg font-medium text-foreground">Organization Information</h2>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage your company's core details. Only administrators can view and edit this section.
                        </p>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-muted-foreground">Company Name</label>
                                <input
                                    type="text"
                                    value={company.name}
                                    onChange={(e) => setCompany({ ...company, name: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-border bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground">Current Plan</label>
                                <div className="mt-1 flex items-center">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary capitalize">
                                        {company.plan}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground">Subscription Status</label>
                                <div className="mt-1">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${company.subscription_status === 'active'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                        }`}>
                                        {company.subscription_status}
                                    </span>
                                </div>
                            </div>

                            <div className="sm:col-span-2">
                                <div className="rounded-md bg-muted p-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-foreground">Restricted Access</h3>
                                            <div className="mt-2 text-sm text-muted-foreground">
                                                <p>
                                                    This page is only visible to users with the 'Admin' role. Managers and Cashiers cannot access or modify these settings.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
