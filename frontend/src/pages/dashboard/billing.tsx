import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { CreditCard, Check, AlertTriangle, Lock } from 'lucide-react';

interface Subscription {
    plan: string;
    status: string;
    stripe_customer_id: string | null;
    subscription_id: string | null;
}

// ============================================
// VENDOR NOTE: Payment functionality is ready
// but hidden from frontend for customization.
// Uncomment payment handlers after configuring
// your payment provider credentials.
// ============================================

export default function BillingPage() {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSubscription();
    }, []);

    const fetchSubscription = async () => {
        try {
            const res = await api.get('/billing/subscription');
            setSubscription(res.data);
        } catch (error) {
            console.error('Failed to fetch subscription', error);
        } finally {
            setLoading(false);
        }
    };

    /* VENDOR: Uncomment these handlers after configuring payment providers
    const handleSubscribe = async (plan: string) => {
        try {
            const res = await api.post(`/billing/stripe/create-checkout-session?plan=${plan}`);
            window.location.href = res.data.url;
        } catch (error) {
            alert('Failed to initiate Stripe checkout');
        }
    };

    const handlePayPalSubscribe = async (plan: string) => {
        try {
            const res = await api.post(`/billing/paypal/create-order?plan=${plan}`);
            window.location.href = res.data.approval_url;
        } catch (error) {
            alert('Failed to initiate PayPal checkout');
        }
    };

    const handleManageSubscription = async () => {
        try {
            const res = await api.post('/billing/stripe/create-portal-session');
            window.location.href = res.data.url;
        } catch (error) {
            alert('Failed to open billing portal');
        }
    };
    */

    return (
        <DashboardLayout>
            <div className="space-y-8">
                <h1 className="text-2xl font-semibold text-white">Billing & Subscription</h1>

                {/* Current Plan Status */}
                <div className="bg-black border border-white/20 shadow-none overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg leading-6 font-medium text-white">Current Plan</h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-400">View your subscription and upgrade options.</p>
                        </div>
                        {subscription?.status === 'active' && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/10 text-white border border-white/20">
                                Active
                            </span>
                        )}
                    </div>
                    <div className="border-t border-white/20 px-4 py-5 sm:p-6">
                        {loading ? (
                            <p className="text-gray-400">Loading subscription details...</p>
                        ) : (
                            <div>
                                <div className="flex items-center space-x-4">
                                    <div className="bg-white/10 p-3 rounded-full border border-white/20">
                                        <CreditCard className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-medium text-white">
                                            {subscription?.plan ? subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1) : 'Free'} Plan
                                        </p>
                                        <p className="text-sm text-gray-400">
                                            Contact support to upgrade your plan
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Available Plans */}
                <div className="bg-black border border-white/20 shadow-none overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-white">Available Plans</h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-400">Upgrade to unlock premium features.</p>
                    </div>
                    <div className="border-t border-white/20 px-4 py-5 sm:p-0">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 p-6">
                            {/* Free Plan */}
                            <div className={`border rounded-lg p-6 text-center ${subscription?.plan === 'free' ? 'border-white ring-2 ring-white' : 'border-white/20'}`}>
                                <h4 className="text-xl font-bold text-white">Free</h4>
                                <p className="text-gray-400 mt-2">$0/mo</p>
                                <ul className="mt-4 text-sm text-left space-y-2 text-gray-300">
                                    <li className="flex items-center"><Check className="h-4 w-4 text-white mr-2" /> 1 User</li>
                                    <li className="flex items-center"><Check className="h-4 w-4 text-white mr-2" /> 100 Items</li>
                                    <li className="flex items-center"><Check className="h-4 w-4 text-white mr-2" /> Basic Reports</li>
                                </ul>
                                <button
                                    className="mt-6 w-full bg-white/10 text-white py-2 rounded disabled:opacity-50 border border-white/20"
                                    disabled={subscription?.plan === 'free'}
                                >
                                    {subscription?.plan === 'free' ? 'Current Plan' : 'Free Plan'}
                                </button>
                            </div>

                            {/* Starter Plan */}
                            <div className={`border rounded-lg p-6 text-center ${subscription?.plan === 'starter' ? 'border-white ring-2 ring-white' : 'border-white/20'}`}>
                                <h4 className="text-xl font-bold text-white">Starter</h4>
                                <p className="text-gray-400 mt-2">$29/mo</p>
                                <ul className="mt-4 text-sm text-left space-y-2 text-gray-300">
                                    <li className="flex items-center"><Check className="h-4 w-4 text-white mr-2" /> 5 Users</li>
                                    <li className="flex items-center"><Check className="h-4 w-4 text-white mr-2" /> Unlimited Items</li>
                                    <li className="flex items-center"><Check className="h-4 w-4 text-white mr-2" /> PDF Invoices</li>
                                </ul>
                                {subscription?.plan === 'starter' ? (
                                    <button className="mt-6 w-full bg-white/10 text-white py-2 rounded border border-white/20" disabled>Current Plan</button>
                                ) : (
                                    <div className="space-y-2 mt-6">
                                        <button
                                            className="w-full bg-white/10 text-white py-2 rounded border border-white/20 flex items-center justify-center gap-2 cursor-not-allowed"
                                            disabled
                                        >
                                            <Lock className="h-4 w-4" />
                                            Contact Sales
                                        </button>
                                        <p className="text-xs text-gray-500 text-center">Payment setup required</p>
                                    </div>
                                )}
                            </div>

                            {/* Pro Plan */}
                            <div className={`border rounded-lg p-6 text-center ${subscription?.plan === 'pro' ? 'border-white ring-2 ring-white' : 'border-white/20'}`}>
                                <h4 className="text-xl font-bold text-white">Pro</h4>
                                <p className="text-gray-400 mt-2">$99/mo</p>
                                <ul className="mt-4 text-sm text-left space-y-2 text-gray-300">
                                    <li className="flex items-center"><Check className="h-4 w-4 text-white mr-2" /> Unlimited Users</li>
                                    <li className="flex items-center"><Check className="h-4 w-4 text-white mr-2" /> AI Insights</li>
                                    <li className="flex items-center"><Check className="h-4 w-4 text-white mr-2" /> Priority Support</li>
                                </ul>
                                {subscription?.plan === 'pro' ? (
                                    <button className="mt-6 w-full bg-white/10 text-white py-2 rounded border border-white/20" disabled>Current Plan</button>
                                ) : (
                                    <div className="space-y-2 mt-6">
                                        <button
                                            className="w-full bg-white/10 text-white py-2 rounded border border-white/20 flex items-center justify-center gap-2 cursor-not-allowed"
                                            disabled
                                        >
                                            <Lock className="h-4 w-4" />
                                            Contact Sales
                                        </button>
                                        <p className="text-xs text-gray-500 text-center">Payment setup required</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* VENDOR INFO NOTICE */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-start">
                        <AlertTriangle className="h-5 w-5 text-blue-400 mt-0.5 mr-3" />
                        <div>
                            <h4 className="text-sm font-medium text-blue-300">Payment Setup Required</h4>
                            <p className="mt-1 text-sm text-blue-400/80">
                                Configure your payment provider (Stripe/PayPal/Instamojo) to enable automatic billing.
                                Backend is ready - just add your API credentials in the environment configuration.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
