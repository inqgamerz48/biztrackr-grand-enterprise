import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Save, User, Lock, Bell, Globe, Palette } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function SettingsPage() {
    const { user, updateProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({
        name: '',
        email: '',
        notifications_email: true,
        notifications_push: false,
        language: 'en',
        timezone: 'UTC'
    });

    useEffect(() => {
        if (user) {
            setSettings(prev => ({
                ...prev,
                name: user.full_name || '',
                email: user.email || '',
            }));
        }
    }, [user]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await updateProfile({
                full_name: settings.name,
                email: settings.email
            });

            if (res.success) {
                alert('Settings saved successfully');
            } else {
                alert('Failed to save settings: ' + res.error);
            }
        } catch (error) {
            console.error('Failed to save settings', error);
            alert('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };



    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-primary-foreground bg-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                        <Save className="mr-2 h-4 w-4" />
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Profile Settings */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-card border border-border shadow-none rounded-lg overflow-hidden">
                            <div className="p-6 border-b border-border">
                                <div className="flex items-center">
                                    <User className="h-6 w-6 text-primary mr-3" />
                                    <h2 className="text-lg font-medium text-foreground">Profile Information</h2>
                                </div>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground">Full Name</label>
                                        <input
                                            type="text"
                                            value={settings.name}
                                            onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                                            className="mt-1 block w-full rounded-md border-border bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground">Email Address</label>
                                        <input
                                            type="email"
                                            value={settings.email}
                                            onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                                            className="mt-1 block w-full rounded-md border-border bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card border border-border shadow-none rounded-lg overflow-hidden">
                            <div className="p-6 border-b border-border">
                                <div className="flex items-center">
                                    <Lock className="h-6 w-6 text-primary mr-3" />
                                    <h2 className="text-lg font-medium text-foreground">Security</h2>
                                </div>
                            </div>
                            <div className="p-6">
                                <button className="text-primary hover:text-primary/80 font-medium text-sm">
                                    Change Password
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Preferences */}
                    <div className="space-y-6">
                        <div className="bg-card border border-border shadow-none rounded-lg overflow-hidden">
                            <div className="p-6 border-b border-border">
                                <div className="flex items-center">
                                    <Bell className="h-6 w-6 text-primary mr-3" />
                                    <h2 className="text-lg font-medium text-foreground">Notifications</h2>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex items-start">
                                    <div className="flex h-5 items-center">
                                        <input
                                            type="checkbox"
                                            checked={settings.notifications_email}
                                            onChange={(e) => setSettings({ ...settings, notifications_email: e.target.checked })}
                                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary bg-background"
                                        />
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <label className="font-medium text-foreground">Email Notifications</label>
                                        <p className="text-muted-foreground">Receive daily summaries and alerts.</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="flex h-5 items-center">
                                        <input
                                            type="checkbox"
                                            checked={settings.notifications_push}
                                            onChange={(e) => setSettings({ ...settings, notifications_push: e.target.checked })}
                                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary bg-background"
                                        />
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <label className="font-medium text-foreground">Push Notifications</label>
                                        <p className="text-muted-foreground">Receive real-time alerts on your device.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card border border-border shadow-none rounded-lg overflow-hidden">
                            <div className="p-6 border-b border-border">
                                <div className="flex items-center">
                                    <Globe className="h-6 w-6 text-primary mr-3" />
                                    <h2 className="text-lg font-medium text-foreground">Regional</h2>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground">Language</label>
                                    <select
                                        value={settings.language}
                                        onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-border bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border"
                                    >
                                        <option value="en">English</option>
                                        <option value="es">Spanish</option>
                                        <option value="fr">French</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground">Timezone</label>
                                    <select
                                        value={settings.timezone}
                                        onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-border bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border"
                                    >
                                        <option value="UTC">UTC</option>
                                        <option value="EST">EST</option>
                                        <option value="PST">PST</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
