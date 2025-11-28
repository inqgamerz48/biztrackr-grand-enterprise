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
                <h1 className="text-2xl font-semibold text-gray-900">Billing & Subscription</h1>

                {/* Current Plan Status */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Current Plan</h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage your subscription and billing details.</p>
                        </div>
                        {subscription?.status === 'active' && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                Active
                            </span>
                        )}
                    </div>
                    <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                        {loading ? (
                            <p>Loading subscription details...</p>
                        ) : (
                            <div>
                                <div className="flex items-center space-x-4">
                                    <div className="bg-indigo-100 p-3 rounded-full">
                                        <CreditCard className="h-6 w-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-medium text-gray-900">
                                            {subscription?.plan ? subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1) : 'Free'} Plan
                                        </p>
                                        <p className="text-sm text-gray-500">
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
                                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Available Plans</h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">Upgrade to unlock more features.</p>
                    </div>
                    <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 p-6">
                            {/* Free Plan */}
                            <div className={`border rounded-lg p-6 text-center ${subscription?.plan === 'free' ? 'border-indigo-500 ring-2 ring-indigo-500' : ''}`}>
                                <h4 className="text-xl font-bold">Free</h4>
                                <p className="text-gray-500 mt-2">$0/mo</p>
                                <ul className="mt-4 text-sm text-left space-y-2">
                                    <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" /> 1 User</li>
                                    <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" /> 100 Items</li>
                                    <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" /> Basic Reports</li>
                                </ul>
                                <button
                                    className="mt-6 w-full bg-gray-100 text-gray-800 py-2 rounded disabled:opacity-50"
                                    disabled={subscription?.plan === 'free'}
                                >
                                    {subscription?.plan === 'free' ? 'Current Plan' : 'Downgrade'}
                                </button>
                            </div>

                            {/* Starter Plan */}
                            <div className={`border rounded-lg p-6 text-center ${subscription?.plan === 'starter' ? 'border-indigo-500 ring-2 ring-indigo-500' : ''}`}>
                                <h4 className="text-xl font-bold">Starter</h4>
                                <p className="text-gray-500 mt-2">$29/mo</p>
                                <ul className="mt-4 text-sm text-left space-y-2">
                                    <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" /> 5 Users</li>
                                    <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" /> Unlimited Items</li>
                                    <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" /> PDF Invoices</li>
                                </ul>
                                {subscription?.plan === 'starter' ? (
                                    <button className="mt-6 w-full bg-gray-100 text-gray-800 py-2 rounded" disabled>Current Plan</button>
                                ) : (
                                    <div className="space-y-2 mt-6">
                                        <button
                                            onClick={() => handleSubscribe('starter')}
                                            className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
                                        >
                                            Upgrade with Card
                                        </button>
                                        <button
                                            onClick={() => handlePayPalSubscribe('starter')}
                                            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                                        >
                                            Pay with PayPal
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Pro Plan */}
                            <div className={`border rounded-lg p-6 text-center ${subscription?.plan === 'pro' ? 'border-indigo-500 ring-2 ring-indigo-500' : ''}`}>
                                <h4 className="text-xl font-bold">Pro</h4>
                                <p className="text-gray-500 mt-2">$99/mo</p>
                                <ul className="mt-4 text-sm text-left space-y-2">
                                    <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" /> Unlimited Users</li>
                                    <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" /> AI Insights</li>
                                    <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" /> Priority Support</li>
                                </ul>
                                {subscription?.plan === 'pro' ? (
                                    <button className="mt-6 w-full bg-gray-100 text-gray-800 py-2 rounded" disabled>Current Plan</button>
                                ) : (
                                    <div className="space-y-2 mt-6">
                                        <button
                                            onClick={() => handleSubscribe('pro')}
                                            className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
                                        >
                                            Upgrade with Card
                                        </button>
                                        <button
                                            onClick={() => handlePayPalSubscribe('pro')}
                                            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
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
