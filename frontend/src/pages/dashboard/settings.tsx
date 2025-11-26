import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import DashboardLayout from '@/components/layout/dashboard-layout';

interface Settings {
    company_name: string;
    currency_symbol: string;
    tax_rate: number;
    logo_url?: string;
    terms_and_conditions?: string;
    enable_notifications: boolean;
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<Settings>({
        company_name: '',
        currency_symbol: '$',
        tax_rate: 0.1,
        enable_notifications: true
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/settings/');
            setSettings(res.data);
        } catch (error) {
            console.error('Failed to fetch settings', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/settings/', settings);
            alert('Settings saved successfully!');
        } catch (error) {
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleSubscribe = async (plan: string) => {
        try {
            const res = await api.post(`/billing/create-checkout-session?plan=${plan}`);
            window.location.href = res.data.url;
        } catch (error) {
            alert('Failed to initiate checkout');
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-8">
                <h1 className="text-2xl font-semibold text-gray-900">Settings & Billing</h1>

                {/* General Settings */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">General Configuration</h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage your global application settings.</p>
                    </div>
                    <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                        {loading ? (
                            <p>Loading settings...</p>
                        ) : (
                            <form onSubmit={handleSave} className="space-y-6">
                                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                                    <div className="sm:col-span-3">
                                        <label className="block text-sm font-medium text-gray-700">Company Name</label>
                                        <input
                                            type="text"
                                            value={settings.company_name}
                                            onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>

                                    <div className="sm:col-span-3">
                                        <label className="block text-sm font-medium text-gray-700">Currency Symbol</label>
                                        <input
                                            type="text"
                                            value={settings.currency_symbol}
                                            onChange={(e) => setSettings({ ...settings, currency_symbol: e.target.value })}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>

                                    <div className="sm:col-span-3">
                                        <label className="block text-sm font-medium text-gray-700">Tax Rate (decimal, e.g. 0.10)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={settings.tax_rate}
                                            onChange={(e) => setSettings({ ...settings, tax_rate: parseFloat(e.target.value) })}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>

                                    <div className="sm:col-span-3 flex items-center mt-6">
                                        <input
                                            id="notifications"
                                            type="checkbox"
                                            checked={settings.enable_notifications}
                                            onChange={(e) => setSettings({ ...settings, enable_notifications: e.target.checked })}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="notifications" className="ml-2 block text-sm text-gray-900">
                                            Enable Notifications
                                        </label>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                    >
                                        {saving ? 'Saving...' : 'Save Settings'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* Subscription Plans */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Subscription Plans</h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">Upgrade your plan to unlock more features.</p>
                    </div>
                    <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 p-6">
                            {/* Free Plan */}
                            <div className="border rounded-lg p-6 text-center">
                                <h4 className="text-xl font-bold">Free</h4>
                                <p className="text-gray-500 mt-2">$0/mo</p>
                                <ul className="mt-4 text-sm text-left space-y-2">
                                    <li>✓ 100 Items</li>
                                    <li>✓ Basic Reports</li>
                                </ul>
                                <button className="mt-6 w-full bg-gray-100 text-gray-800 py-2 rounded" disabled>Current Plan</button>
                            </div>

                            {/* Starter Plan */}
                            <div className="border rounded-lg p-6 text-center border-indigo-500 ring-1 ring-indigo-500">
                                <h4 className="text-xl font-bold">Starter</h4>
                                <p className="text-gray-500 mt-2">$29/mo</p>
                                <ul className="mt-4 text-sm text-left space-y-2">
                                    <li>✓ Unlimited Items</li>
                                    <li>✓ PDF Invoices</li>
                                    <li>✓ Email Support</li>
                                </ul>
                                <button
                                    onClick={() => handleSubscribe('starter')}
                                    className="mt-6 w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
                                >
                                    Upgrade
                                </button>
                            </div>

                            {/* Pro Plan */}
                            <div className="border rounded-lg p-6 text-center">
                                <h4 className="text-xl font-bold">Pro</h4>
                                <p className="text-gray-500 mt-2">$99/mo</p>
                                <ul className="mt-4 text-sm text-left space-y-2">
                                    <li>✓ Everything in Starter</li>
                                    <li>✓ AI Insights</li>
                                    <li>✓ API Access</li>
                                </ul>
                                <button
                                    onClick={() => handleSubscribe('pro')}
                                    className="mt-6 w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
                                >
                                    Upgrade
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
