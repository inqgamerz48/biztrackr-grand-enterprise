import { useState } from 'react';
import api from '@/lib/axios';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { motion } from 'framer-motion';

export default function UpgradePage() {
    const [plan, setPlan] = useState('pro');
    const [paymentRef, setPaymentRef] = useState('');
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!screenshot || !paymentRef) {
            alert("Please provide payment reference and screenshot");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('plan', plan);
        formData.append('payment_ref', paymentRef);
        formData.append('screenshot', screenshot);

        try {
            await api.post('/upgrade/request', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSubmitted(true);
        } catch (error) {
            console.error(error);
            alert("Failed to submit request");
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                    <h1 className="text-2xl font-bold text-green-600">Request Submitted!</h1>
                    <p className="text-gray-600">We have received your upgrade request. Please allow 24 hours for approval.</p>
                    <a href="/dashboard" className="text-indigo-600 hover:underline">Back to Dashboard</a>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl mx-auto space-y-8"
            >
                <h1 className="text-3xl font-bold text-gray-900">Upgrade Plan</h1>

                <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
                    <div className="space-y-2">
                        <h2 className="text-xl font-semibold">1. Select Plan</h2>
                        <select
                            value={plan}
                            onChange={(e) => setPlan(e.target.value)}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="basic">Basic Plan - $10/mo</option>
                            <option value="pro">Pro Plan - $29/mo</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-xl font-semibold">2. Scan to Pay</h2>
                        <div className="flex justify-center p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                            {/* Placeholder for Owner QR - In real app fetch from settings */}
                            <div className="text-center">
                                <img src="/static/owner_qr_placeholder.png" alt="Owner QR" className="w-48 h-48 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">Scan this QR code to pay via UPI/Bank App</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold">3. Submit Proof</h2>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Payment Reference ID</label>
                                <input
                                    type="text"
                                    value={paymentRef}
                                    onChange={(e) => setPaymentRef(e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="e.g. UPI Ref No. 1234567890"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Upload Screenshot</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setScreenshot(e.target.files ? e.target.files[0] : null)}
                                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </form>
                </div>
            </motion.div>
        </DashboardLayout>
    );
}
