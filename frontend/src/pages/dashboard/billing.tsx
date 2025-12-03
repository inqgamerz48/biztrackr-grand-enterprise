import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { CreditCard, Check, AlertTriangle } from 'lucide-react';

interface Subscription {
    plan: string;
    status: string;
    stripe_customer_id: string | null;
    subscription_id: string | null;
}

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

    return (
        <DashboardLayout>
            <div className="space-y-8">
                <h1 className="text-2xl font-semibold text-white">Billing & Subscription</h1>

                {/* Current Plan Status */}
                <div className="bg-black border border-white/20 shadow-none overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg leading-6 font-medium text-white">Current Plan</h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-400">Manage your subscription and billing details.</p>
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
                                            {subscription?.stripe_customer_id
                                                ? 'Managed via Stripe'
                                                : 'No active payment method'}
                                        </p>
                                    </div>
                                </div>

                                {subscription?.stripe_customer_id && (
                                    <div className="mt-6">
                                        <button
                                            onClick={handleManageSubscription}
                                            className="inline-flex items-center px-4 py-2 border border-white/20 shadow-sm text-sm font-medium rounded-md text-white bg-black hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
                                        >
                                            Manage Subscription
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Available Plans */}
                <div className="bg-black border border-white/20 shadow-none overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-white">Available Plans</h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-400">Upgrade to unlock more features.</p>
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
                                    {subscription?.plan === 'free' ? 'Current Plan' : 'Downgrade'}
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
                                            onClick={() => handleSubscribe('starter')}
                                            className="w-full bg-white text-black py-2 rounded hover:bg-gray-200 font-bold border border-white"
                                        >
                                            Upgrade with Card
                                        </button>
                                        <button
                                            onClick={() => handlePayPalSubscribe('starter')}
                                            className="w-full bg-black text-white py-2 rounded hover:bg-white/10 border border-white/20"
                                        >
                                            Pay with PayPal
                                        </button>
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
                                            onClick={() => handleSubscribe('pro')}
                                            className="w-full bg-white text-black py-2 rounded hover:bg-gray-200 font-bold border border-white"
                                        >
                                            Upgrade with Card
                                        </button>
                                        <button
                                            onClick={() => handlePayPalSubscribe('pro')}
                                            className="w-full bg-black text-white py-2 rounded hover:bg-white/10 border border-white/20"
                                        >
                                            Pay with PayPal
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
