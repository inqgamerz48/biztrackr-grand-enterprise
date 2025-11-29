import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Plus, Trash2, Edit2, DollarSign, CreditCard } from 'lucide-react';

export default function BankingPage() {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'Cash',
        initial_balance: 0,
        currency: 'INR'
    });

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const res = await api.get('/banking/');
            setAccounts(res.data);
        } catch (error) {
            console.error('Failed to fetch accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingAccount) {
                await api.put(`/banking/${editingAccount.id}`, formData);
            } else {
                await api.post('/banking/', formData);
            }
            setShowModal(false);
            setEditingAccount(null);
            setFormData({ name: '', type: 'Cash', initial_balance: 0, currency: 'INR' });
            fetchAccounts();
        } catch (error) {
            console.error('Failed to save account:', error);
            alert('Failed to save account');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this account?')) return;
        try {
            await api.delete(`/banking/${id}`);
            fetchAccounts();
        } catch (error) {
            console.error('Failed to delete account:', error);
            alert('Failed to delete account');
        }
    };

    const openEdit = (account: any) => {
        setEditingAccount(account);
        setFormData({
            name: account.name,
            type: account.type,
            initial_balance: account.balance,
            currency: account.currency
        });
        setShowModal(true);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Banking & Cash Flow</h1>
                        <p className="mt-1 text-sm text-gray-600">Manage payment accounts and track balances</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingAccount(null);
                            setFormData({ name: '', type: 'Cash', initial_balance: 0, currency: 'INR' });
                            setShowModal(true);
                        }}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Add Account
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-gray-500">Loading accounts...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {accounts.map((account) => (
                            <div key={account.id} className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-500">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-3 rounded-full ${account.type === 'Cash' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {account.type === 'Cash' ? <DollarSign size={24} /> : <CreditCard size={24} />}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg text-gray-900">{account.name}</h3>
                                            <p className="text-sm text-gray-500">{account.type}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => openEdit(account)} className="text-gray-400 hover:text-indigo-600">
                                            <Edit2 size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(account.id)} className="text-gray-400 hover:text-red-600">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <p className="text-sm text-gray-500 mb-1">Current Balance</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {account.currency === 'INR' ? '₹' : account.currency} {account.balance.toLocaleString('en-IN')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h2 className="text-xl font-bold mb-4">{editingAccount ? 'Edit Account' : 'New Account'}</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full border border-gray-300 rounded px-3 py-2"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Main Cash Drawer"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                                    <select
                                        className="w-full border border-gray-300 rounded px-3 py-2"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Bank">Bank Account</option>
                                        <option value="Mobile Money">Mobile Money</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {editingAccount ? 'Current Balance' : 'Initial Balance'}
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full border border-gray-300 rounded px-3 py-2"
                                        value={formData.initial_balance}
                                        onChange={(e) => setFormData({ ...formData, initial_balance: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                    >
                                        Save Account
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
