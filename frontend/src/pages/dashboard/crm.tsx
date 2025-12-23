import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import DashboardLayout from '@/components/layout/dashboard-layout';
import toast from 'react-hot-toast';

export default function CRMPage() {
    const [activeTab, setActiveTab] = useState('customers');
    const [customers, setCustomers] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [topCustomers, setTopCustomers] = useState<any[]>([]);
    const [topSuppliers, setTopSuppliers] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [showLedgerModal, setShowLedgerModal] = useState(false);
    const [ledgerData, setLedgerData] = useState<any[]>([]);
    const [ledgerTitle, setLedgerTitle] = useState('');
    const [editingItem, setEditingItem] = useState<any>(null);
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });

    // Payment Form State
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [currentLedgerId, setCurrentLedgerId] = useState<number | null>(null);
    const [paymentData, setPaymentData] = useState({
        amount: '',
        payment_method: 'Cash',
        reference_number: '',
        notes: ''
    });
    const [currentBalance, setCurrentBalance] = useState(0);

    const fetchData = async () => {
        if (activeTab === 'customers') {
            const [res, topRes] = await Promise.all([
                api.get('/crm/customers'),
                api.get('/crm/customers/analytics/top')
            ]);
            setCustomers(res.data);
            setTopCustomers(topRes.data);
        } else {
            const [res, topRes] = await Promise.all([
                api.get('/crm/suppliers'),
                api.get('/crm/suppliers/analytics/top')
            ]);
            setSuppliers(res.data);
            setTopSuppliers(topRes.data);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const endpoint = activeTab === 'customers' ? '/crm/customers' : '/crm/suppliers';

        try {
            if (editingItem) {
                await api.put(`${endpoint}/${editingItem.id}`, formData);
            } else {
                await api.post(endpoint, formData);
            }
            setShowModal(false);
            setEditingItem(null);
            setFormData({ name: '', phone: '', email: '', address: '' });
            fetchData();
            toast.success('Saved successfully');
        } catch (error) {
            toast.error('Failed to save');
        }
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            phone: item.phone || '',
            email: item.email || '',
            address: item.address || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this item?')) return;

        const endpoint = activeTab === 'customers' ? `/crm/customers/${id}` : `/crm/suppliers/${id}`;
        try {
            await api.delete(endpoint);
            fetchData();
            toast.success('Deleted successfully');
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const viewLedger = async (id: number, name: string, balance: number) => {
        setCurrentLedgerId(id);
        setCurrentBalance(balance);
        const endpoint = activeTab === 'customers' ? `/crm/customers/${id}/ledger` : `/crm/suppliers/${id}/ledger`;
        try {
            const res = await api.get(endpoint);
            setLedgerData(res.data);
            setLedgerTitle(`${name} - Transaction History`);
            setShowLedgerModal(true);
            setShowPaymentForm(false); // Reset form visibility
        } catch (error) {
            toast.error('Failed to load ledger');
        }
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentLedgerId) return;

        const endpoint = activeTab === 'customers'
            ? `/crm/customers/${currentLedgerId}/payments`
            : `/crm/suppliers/${currentLedgerId}/payments`;

        try {
            await api.post(endpoint, {
                ...paymentData,
                amount: parseFloat(paymentData.amount)
            });

            // Refresh Ledger
            const ledgerRes = await api.get(activeTab === 'customers' ? `/crm/customers/${currentLedgerId}/ledger` : `/crm/suppliers/${currentLedgerId}/ledger`);
            setLedgerData(ledgerRes.data);

            // Reset Form
            setPaymentData({
                amount: '',
                payment_method: 'Cash',
                reference_number: '',
                notes: ''
            });
            setShowPaymentForm(false);
            fetchData(); // Refresh main list to update balances if shown
            toast.success('Payment recorded');
        } catch (error) {
            toast.error('Failed to record payment');
        }
    };

    return (
        <DashboardLayout>
            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-black border border-white/20 p-6 rounded-lg shadow-none w-96">
                        <h2 className="text-lg font-bold mb-4 text-white">
                            {editingItem ? 'Edit' : 'Add New'} {activeTab === 'customers' ? 'Customer' : 'Supplier'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <input
                                    placeholder="Name"
                                    required
                                    className="w-full bg-black text-white border border-white/20 p-2 rounded focus:ring-white focus:border-white"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                                <input
                                    placeholder="Phone"
                                    className="w-full bg-black text-white border border-white/20 p-2 rounded focus:ring-white focus:border-white"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                                <input
                                    placeholder="Email"
                                    type="email"
                                    className="w-full bg-black text-white border border-white/20 p-2 rounded focus:ring-white focus:border-white"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                                <textarea
                                    placeholder="Address"
                                    rows={2}
                                    className="w-full bg-black text-white border border-white/20 p-2 rounded focus:ring-white focus:border-white"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <div className="mt-4 flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingItem(null);
                                        setFormData({ name: '', phone: '', email: '', address: '' });
                                    }}
                                    className="bg-white/10 text-white px-4 py-2 rounded hover:bg-white/20 border border-white/20"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="bg-white text-black px-4 py-2 rounded hover:bg-gray-200 font-medium">
                                    {editingItem ? 'Update' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Ledger Modal */}
            {showLedgerModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-black border border-white/20 p-6 rounded-lg shadow-none w-[900px] max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white">{ledgerTitle}</h2>
                            <button
                                onClick={() => setShowPaymentForm(!showPaymentForm)}
                                className="bg-white/10 text-white border border-white/20 px-3 py-1 rounded text-sm hover:bg-white/20"
                            >
                                {showPaymentForm ? 'Cancel Payment' : 'Record Payment'}
                            </button>
                        </div>

                        {showPaymentForm && (
                            <div className="mb-6 bg-white/5 p-4 rounded border border-white/10">
                                <h3 className="text-sm font-semibold mb-2 text-white">Record New Payment</h3>
                                <div className="mb-4 flex flex-col sm:flex-row gap-4 bg-black/20 p-3 rounded">
                                    <div>
                                        <p className="text-xs text-gray-400">Current Credit</p>
                                        <p className="text-lg font-bold text-red-400">₹{currentBalance.toLocaleString('en-IN')}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Payment Amount</p>
                                        <p className="text-lg font-bold text-green-400">
                                            - ₹{parseFloat(paymentData.amount || '0').toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                    <div className="border-t sm:border-t-0 sm:border-l border-white/10 pt-2 sm:pt-0 sm:pl-4">
                                        <p className="text-xs text-gray-400">Resulting Balance</p>
                                        <p className="text-lg font-bold text-white">
                                            ₹{(currentBalance - parseFloat(paymentData.amount || '0')).toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                </div>
                                <form onSubmit={handlePaymentSubmit} className="grid grid-cols-2 gap-4">
                                    <input
                                        type="number"
                                        placeholder="Amount"
                                        required
                                        className="bg-black text-white border border-white/20 p-2 rounded focus:ring-white focus:border-white"
                                        value={paymentData.amount}
                                        onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                                    />
                                    <select
                                        className="bg-black text-white border border-white/20 p-2 rounded focus:ring-white focus:border-white"
                                        value={paymentData.payment_method}
                                        onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="Check">Check</option>
                                        <option value="UPI">UPI</option>
                                    </select>
                                    <input
                                        placeholder="Reference Number"
                                        className="bg-black text-white border border-white/20 p-2 rounded focus:ring-white focus:border-white"
                                        value={paymentData.reference_number}
                                        onChange={(e) => setPaymentData({ ...paymentData, reference_number: e.target.value })}
                                    />
                                    <input
                                        placeholder="Notes"
                                        className="bg-black text-white border border-white/20 p-2 rounded focus:ring-white focus:border-white"
                                        value={paymentData.notes}
                                        onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                                    />
                                    <div className="col-span-2 flex justify-end">
                                        <button type="submit" className="bg-white text-black px-4 py-2 rounded text-sm hover:bg-gray-200 font-medium">
                                            Save Payment
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {ledgerData.length === 0 ? (
                            <p className="text-gray-400 text-center py-8">No transactions found</p>
                        ) : (
                            <table className="min-w-full divide-y divide-white/10">
                                <thead className="bg-white/5">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Description</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Debit</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Credit</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-black divide-y divide-white/10">
                                    {ledgerData.map((txn) => (
                                        <tr key={`${txn.type}-${txn.id}`}>
                                            <td className="px-4 py-2 text-sm text-gray-400">
                                                {new Date(txn.date).toLocaleDateString('en-IN')}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-white">{txn.description}</td>
                                            <td className="px-4 py-2 text-sm text-right text-white">
                                                {txn.debit > 0 ? `₹${txn.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-right text-white">
                                                {txn.credit > 0 ? `₹${txn.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-right font-bold text-white">
                                                ₹{txn.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={() => setShowLedgerModal(false)}
                                className="bg-white/10 text-white px-4 py-2 rounded hover:bg-white/20 border border-white/20"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-2xl font-semibold text-white">CRM</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="w-full sm:w-auto bg-white text-black px-4 py-2 rounded hover:bg-gray-200 font-medium"
                >
                    Add {activeTab === 'customers' ? 'Customer' : 'Supplier'}
                </button>
            </div>

            <div className="border-b border-white/20 mb-4">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('customers')}
                        className={`${activeTab === 'customers' ? 'border-white text-white' : 'border-transparent text-gray-400 hover:text-white hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Customers
                    </button>
                    <button
                        onClick={() => setActiveTab('suppliers')}
                        className={`${activeTab === 'suppliers' ? 'border-white text-white' : 'border-transparent text-gray-400 hover:text-white hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Suppliers
                    </button>
                </nav>
            </div>

            {/* Analytics Section */}
            <div className="mb-6 bg-black border border-white/20 shadow-none rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 text-white">
                    Top {activeTab === 'customers' ? 'Customers' : 'Suppliers'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(activeTab === 'customers' ? topCustomers : topSuppliers).map((item) => (
                        <div key={item.id} className="border border-white/10 rounded p-3 bg-white/5">
                            <p className="font-semibold text-white">{item.name}</p>
                            <p className="text-sm text-gray-400">{item.phone}</p>
                            <p className="text-lg font-bold text-white mt-2">
                                ₹{(activeTab === 'customers' ? item.total_sales : item.total_purchases).toLocaleString('en-IN')}
                            </p>
                            <p className="text-xs text-gray-500">{item.transaction_count} transactions</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="bg-black border border-white/20 shadow-none overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-white/10">
                    {(activeTab === 'customers' ? customers : suppliers).map((item) => (
                        <li key={item.id} className="px-4 py-4 sm:px-6 hover:bg-white/5 transition-colors">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex-1 w-full">
                                    <p className="text-sm font-medium text-white truncate">{item.name}</p>
                                    <div className="mt-2 flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                                        <p className="flex items-center text-sm text-gray-400">{item.phone}</p>
                                        {item.email && <p className="flex items-center text-sm text-gray-400">{item.email}</p>}
                                        {item.outstanding_balance > 0 && (
                                            <p className="text-sm font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded border border-red-400/20">
                                                Credit: ₹{item.outstanding_balance.toLocaleString('en-IN')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                                    {item.outstanding_balance > 0 && (
                                        <button
                                            onClick={() => {
                                                setCurrentLedgerId(item.id);
                                                setLedgerTitle(item.name);
                                                setCurrentBalance(item.outstanding_balance);
                                                setShowLedgerModal(true);
                                                setShowPaymentForm(true);
                                            }}
                                            className="flex-1 sm:flex-none bg-green-600/20 text-green-400 px-3 py-1.5 rounded hover:bg-green-600/30 text-sm font-medium border border-green-600/30 whitespace-nowrap flex items-center justify-center gap-1"
                                        >
                                            ₹ Pay
                                        </button>
                                    )}
                                    <button
                                        onClick={() => viewLedger(item.id, item.name, item.outstanding_balance)}
                                        className="flex-1 sm:flex-none bg-white/10 text-white px-3 py-1.5 rounded hover:bg-white/20 text-sm font-medium border border-white/20 whitespace-nowrap"
                                    >
                                        Ledger
                                    </button>
                                    <button
                                        onClick={() => handleEdit(item)}
                                        className="flex-1 sm:flex-none bg-white/10 text-white px-3 py-1.5 rounded hover:bg-white/20 text-sm font-medium border border-white/20 whitespace-nowrap"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="flex-1 sm:flex-none bg-white/10 text-white px-3 py-1.5 rounded hover:bg-white/20 text-sm font-medium border border-white/20 whitespace-nowrap"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </DashboardLayout>
    );
}
