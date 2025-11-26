import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import DashboardLayout from '@/components/layout/dashboard-layout';

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
        } catch (error) {
            alert('Failed to save');
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
        } catch (error) {
            alert('Failed to delete');
        }
    };

    const viewLedger = async (id: number, name: string) => {
        const endpoint = activeTab === 'customers' ? `/crm/customers/${id}/ledger` : `/crm/suppliers/${id}/ledger`;
        try {
            const res = await api.get(endpoint);
            setLedgerData(res.data);
            setLedgerTitle(`${name} - Transaction History`);
            setShowLedgerModal(true);
        } catch (error) {
            alert('Failed to load ledger');
        }
    };

    return (
        <DashboardLayout>
            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                        <h2 className="text-lg font-bold mb-4">
                            {editingItem ? 'Edit' : 'Add New'} {activeTab === 'customers' ? 'Customer' : 'Supplier'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <input
                                    placeholder="Name"
                                    required
                                    className="w-full border p-2 rounded"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                                <input
                                    placeholder="Phone"
                                    className="w-full border p-2 rounded"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                                <input
                                    placeholder="Email"
                                    type="email"
                                    className="w-full border p-2 rounded"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                                <textarea
                                    placeholder="Address"
                                    rows={2}
                                    className="w-full border p-2 rounded"
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
                                    className="bg-gray-200 px-4 py-2 rounded"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded">
                                    {editingItem ? 'Update' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Ledger Modal */}
            {showLedgerModal && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-[700px] max-h-[80vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">{ledgerTitle}</h2>
                        {ledgerData.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No transactions found</p>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {ledgerData.map((txn) => (
                                        <tr key={txn.id}>
                                            <td className="px-4 py-2 text-sm text-gray-900">{txn.invoice_number}</td>
                                            <td className="px-4 py-2 text-sm text-gray-500">
                                                {new Date(txn.date).toLocaleDateString('en-IN')}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-right font-semibold text-gray-900">
                                                ₹{txn.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={() => setShowLedgerModal(false)}
                                className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">CRM</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                >
                    Add {activeTab === 'customers' ? 'Customer' : 'Supplier'}
                </button>
            </div>

            <div className="border-b border-gray-200 mb-4">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('customers')}
                        className={`${activeTab === 'customers' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Customers
                    </button>
                    <button
                        onClick={() => setActiveTab('suppliers')}
                        className={`${activeTab === 'suppliers' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Suppliers
                    </button>
                </nav>
            </div>

            {/* Analytics Section */}
            <div className="mb-6 bg-white shadow rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">
                    Top {activeTab === 'customers' ? 'Customers' : 'Suppliers'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(activeTab === 'customers' ? topCustomers : topSuppliers).map((item) => (
                        <div key={item.id} className="border rounded p-3 bg-gray-50">
                            <p className="font-semibold text-gray-900">{item.name}</p>
                            <p className="text-sm text-gray-600">{item.phone}</p>
                            <p className="text-lg font-bold text-indigo-600 mt-2">
                                ₹{(activeTab === 'customers' ? item.total_sales : item.total_purchases).toLocaleString('en-IN')}
                            </p>
                            <p className="text-xs text-gray-500">{item.transaction_count} transactions</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {(activeTab === 'customers' ? customers : suppliers).map((item) => (
                        <li key={item.id} className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-indigo-600 truncate">{item.name}</p>
                                    <div className="mt-2 flex justify-between">
                                        <div className="sm:flex space-x-4">
                                            <p className="flex items-center text-sm text-gray-500">{item.phone}</p>
                                            {item.email && <p className="flex items-center text-sm text-gray-500">{item.email}</p>}
                                        </div>
                                    </div>
                                </div>
                                <div className="ml-4 flex space-x-2">
                                    <button
                                        onClick={() => viewLedger(item.id, item.name)}
                                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                                    >
                                        Ledger
                                    </button>
                                    <button
                                        onClick={() => handleEdit(item)}
                                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="text-red-600 hover:text-red-900 text-sm font-medium"
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
