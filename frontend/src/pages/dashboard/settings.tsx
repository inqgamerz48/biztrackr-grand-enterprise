import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { motion } from 'framer-motion';

interface Settings {
    company_name: string;
    currency_symbol: string;
    tax_rate: number;
    logo_url?: string;
    terms_and_conditions?: string;
    company_address?: string;
    company_phone?: string;
    company_email?: string;
    company_website?: string;
    footer_text?: string;
    enable_notifications: boolean;
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<Settings>({
        company_name: '',
        currency_symbol: '$',
        tax_rate: 0.1,
        company_address: '',
        company_phone: '',
        company_email: '',
        company_website: '',
        footer_text: 'Thank you for your business!',
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

    // ... (imports remain same)

    return (
        <DashboardLayout>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-8"
            >
                <h1 className="text-2xl font-semibold text-white">Settings & Billing</h1>

                {/* General Settings */}
                <motion.div
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="bg-black border border-white/20 shadow-none sm:rounded-lg"
                >
                    {/* ... (content remains same) */}
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-white">General Configuration</h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-400">Manage your global application settings.</p>
                    </div>
                    <div className="border-t border-white/20 px-4 py-5 sm:p-6">
                        {loading ? (
                            <p className="text-white">Loading settings...</p>
                        ) : (
                            <form onSubmit={handleSave} className="space-y-6">
                                {/* ... (form fields remain same) */}
                                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                                    {/* ... (fields) */}
                                    <div className="sm:col-span-3">
                                        <label className="block text-sm font-medium text-gray-300">Company Name</label>
                                        <input
                                            type="text"
                                            value={settings.company_name}
                                            onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                                            className="mt-1 block w-full bg-black text-white border border-white/20 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-white focus:border-white sm:text-sm"
                                        />
                                    </div>

                                    <div className="sm:col-span-3">
                                        <label className="block text-sm font-medium text-gray-300">Currency Symbol</label>
                                        <input
                                            type="text"
                                            value={settings.currency_symbol}
                                            onChange={(e) => setSettings({ ...settings, currency_symbol: e.target.value })}
                                            className="mt-1 block w-full bg-black text-white border border-white/20 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-white focus:border-white sm:text-sm"
                                        />
                                    </div>

                                    <div className="sm:col-span-3">
                                        <label className="block text-sm font-medium text-gray-300">Tax Rate (decimal, e.g. 0.10)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={settings.tax_rate}
                                            onChange={(e) => setSettings({ ...settings, tax_rate: parseFloat(e.target.value) })}
                                            className="mt-1 block w-full bg-black text-white border border-white/20 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-white focus:border-white sm:text-sm"
                                        />
                                    </div>

                                    <div className="sm:col-span-6">
                                        <label className="block text-sm font-medium text-gray-300">Company Address</label>
                                        <textarea
                                            rows={3}
                                            value={settings.company_address || ''}
                                            onChange={(e) => setSettings({ ...settings, company_address: e.target.value })}
                                            className="mt-1 block w-full bg-black text-white border border-white/20 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-white focus:border-white sm:text-sm"
                                        />
                                    </div>

                                    <div className="sm:col-span-3">
                                        <label className="block text-sm font-medium text-gray-300">Company Phone</label>
                                        <input
                                            type="text"
                                            value={settings.company_phone || ''}
                                            onChange={(e) => setSettings({ ...settings, company_phone: e.target.value })}
                                            className="mt-1 block w-full bg-black text-white border border-white/20 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-white focus:border-white sm:text-sm"
                                        />
                                    </div>

                                    <div className="sm:col-span-3">
                                        <label className="block text-sm font-medium text-gray-300">Company Email</label>
                                        <input
                                            type="email"
                                            value={settings.company_email || ''}
                                            onChange={(e) => setSettings({ ...settings, company_email: e.target.value })}
                                            className="mt-1 block w-full bg-black text-white border border-white/20 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-white focus:border-white sm:text-sm"
                                        />
                                    </div>

                                    <div className="sm:col-span-3">
                                        <label className="block text-sm font-medium text-gray-300">Company Website</label>
                                        <input
                                            type="text"
                                            value={settings.company_website || ''}
                                            onChange={(e) => setSettings({ ...settings, company_website: e.target.value })}
                                            className="mt-1 block w-full bg-black text-white border border-white/20 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-white focus:border-white sm:text-sm"
                                        />
                                    </div>

                                    <div className="sm:col-span-6">
                                        <label className="block text-sm font-medium text-gray-300">Invoice Footer Text</label>
                                        <input
                                            type="text"
                                            value={settings.footer_text || ''}
                                            onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
                                            className="mt-1 block w-full bg-black text-white border border-white/20 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-white focus:border-white sm:text-sm"
                                        />
                                    </div>

                                    <div className="sm:col-span-3 flex items-center mt-6">
                                        <input
                                            id="notifications"
                                            type="checkbox"
                                            checked={settings.enable_notifications}
                                            onChange={(e) => setSettings({ ...settings, enable_notifications: e.target.checked })}
                                            className="h-4 w-4 text-white focus:ring-white border-white/20 rounded bg-black"
                                        />
                                        <label htmlFor="notifications" className="ml-2 block text-sm text-white">
                                            Enable Notifications
                                        </label>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        type="submit"
                                        disabled={saving}
                                        className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-black bg-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white disabled:opacity-50"
                                    >
                                        {saving ? 'Saving...' : 'Save Settings'}
                                    </motion.button>
                                </div>
                            </form>
                        )}
                    </div>
                </motion.div>

                {/* Subscription Management */}
                <motion.div
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="bg-black border border-white/20 shadow-none sm:rounded-lg"
                >
                    {/* ... (content remains same) */}
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-white">Subscription & Billing</h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-400">Manage your plan and billing details.</p>
                    </div>
                    <div className="border-t border-white/20 px-4 py-5 sm:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-medium text-white">Current Plan: <span className="text-white font-bold">Free Tier</span></h4>
                                <p className="text-sm text-gray-400">Upgrade to Pro for unlimited invoices and advanced analytics.</p>
                            </div>
                            <div className="flex space-x-3">
                                <a
                                    href="/dashboard/upgrade"
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-black bg-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
                                >
                                    Upgrade to Pro
                                </a>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Data Management */}
                <motion.div
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="bg-black border border-white/20 shadow-none sm:rounded-lg"
                >
                    {/* ... (content remains same) */}
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-white">Data Management</h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-400">Export your data and manage backups.</p>
                    </div>
                    <div className="border-t border-white/20 px-4 py-5 sm:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-medium text-white">Backup & Export</h4>
                                <p className="text-sm text-gray-400">Download CSV exports of your inventory, sales, and customers.</p>
                            </div>
                            <a
                                href="/dashboard/settings/backup"
                                className="inline-flex items-center px-4 py-2 border border-white/20 shadow-sm text-sm font-medium rounded-md text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
                            >
                                Manage Backups
                            </a>
                        </div>

                        <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/20">
                            <div>
                                <h4 className="text-sm font-medium text-white">Branch Management</h4>
                                <p className="text-sm text-gray-400">Manage multiple business locations and branches.</p>
                            </div>
                            <a
                                href="/dashboard/settings/branches"
                                className="inline-flex items-center px-4 py-2 border border-white/20 shadow-sm text-sm font-medium rounded-md text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
                            >
                                Manage Branches
                            </a>
                        </div>

                        <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/20">
                            <div>
                                <h4 className="text-sm font-medium text-white">Roles & Permissions</h4>
                                <p className="text-sm text-gray-400">Create custom roles and assign permissions.</p>
                            </div>
                            <a
                                href="/dashboard/settings/roles"
                                className="inline-flex items-center px-4 py-2 border border-white/20 shadow-sm text-sm font-medium rounded-md text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
                            >
                                Manage Roles
                            </a>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </DashboardLayout>
    );
}
