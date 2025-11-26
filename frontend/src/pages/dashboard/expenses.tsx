import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import DashboardLayout from '@/components/layout/dashboard-layout';

const EXPENSE_CATEGORIES = [
    'Rent', 'Salaries', 'Utilities', 'Marketing', 'Transport',
    'Maintenance', 'Supplies', 'Insurance', 'Taxes', 'Miscellaneous'
];

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<any[]>([]);
    const [summary, setSummary] = useState<any[]>([]);
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState<any>(null);
    const [formData, setFormData] = useState({
        category: 'Rent',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
    });
    const [filterCategory, setFilterCategory] = useState('');

    useEffect(() => {
        fetchData();
    }, [filterCategory]);

    const fetchData = async () => {
        try {
            const params: any = {};
            if (filterCategory) params.category = filterCategory;

            const [expensesRes, summaryRes, totalRes] = await Promise.all([
                api.get('/expenses', { params }),
                api.get('/expenses/summary/by-category'),
                api.get('/expenses/summary/total')
            ]);

            setExpenses(expensesRes.data);
            setSummary(summaryRes.data);
            setTotalExpenses(totalRes.data.total);
        } catch (error) {
            console.error('Error fetching expenses:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                amount: parseFloat(formData.amount),
                date: new Date(formData.date).toISOString()
            };

            if (editingExpense) {
                await api.put(`/expenses/${editingExpense.id}`, payload);
            } else {
                await api.post('/expenses', payload);
            }

            setShowModal(false);
            setEditingExpense(null);
            setFormData({ category: 'Rent', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
            fetchData();
        } catch (error) {
            alert('Failed to save expense');
        }
    };

    const handleEdit = (expense: any) => {
        setEditingExpense(expense);
        setFormData({
            category: expense.category,
            amount: expense.amount.toString(),
            description: expense.description || '',
            date: expense.date.split('T')[0]
        });
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this expense?')) return;

        try {
            await api.delete(`/expenses/${id}`);
            fetchData();
        } catch (error) {
            alert('Failed to delete expense');
        }
    };

    const getCategoryColor = (category: string) => {
        const colors: any = {
            'Rent': 'bg-blue-100 text-blue-800',
            'Salaries': 'bg-green-100 text-green-800',
            'Utilities': 'bg-yellow-100 text-yellow-800',
            'Marketing': 'bg-purple-100 text-purple-800',
            'Transport': 'bg-pink-100 text-pink-800',
            'Maintenance': 'bg-indigo-100 text-indigo-800',
            'Supplies': 'bg-red-100 text-red-800',
            'Insurance': 'bg-orange-100 text-orange-800',
            'Taxes': 'bg-gray-100 text-gray-800',
            'Miscellaneous': 'bg-teal-100 text-teal-800'
        };
        return colors[category] || 'bg-gray-100 text-gray-800';
    };

    return (
        <DashboardLayout>
            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-[500px]">
                        <h2 className="text-xl font-bold mb-4">
                            {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                                    <select
                                        required
                                        className="w-full border p-2 rounded"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        {EXPENSE_CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        placeholder="0.00"
                                        className="w-full border p-2 rounded"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full border p-2 rounded"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Optional description..."
                                        className="w-full border p-2 rounded"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingExpense(null);
                                        setFormData({ category: 'Rent', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
                                    }}
                                    className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                                    {editingExpense ? 'Update' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-semibold text-gray-900">Expense Management</h1>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                    >
                        Add Expense
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-500 truncate">Total Expenses</p>
                                    <p className="mt-1 text-3xl font-semibold text-gray-900">
                                        ₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    {summary.slice(0, 3).map((item) => (
                        <div key={item.category} className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-500 truncate">{item.category}</p>
                                        <p className="mt-1 text-2xl font-semibold text-gray-900">
                                            ₹{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </p>
                                        <p className="text-xs text-gray-400">{item.count} transactions</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filter */}
                <div className="bg-white p-4 rounded shadow">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Category</label>
                    <select
                        className="block w-full max-w-xs pl-3 pr-10 py-2 text-base border-gray-300 border rounded focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        <option value="">All Categories</option>
                        {EXPENSE_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                {/* Expenses List */}
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {expenses.length === 0 ? (
                            <li className="px-4 py-8 text-center text-gray-500">
                                No expenses found. Click "Add Expense" to get started.
                            </li>
                        ) : (
                            expenses.map((expense) => (
                                <li key={expense.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium text-indigo-600 truncate">
                                                    {expense.description || 'No description'}
                                                </p>
                                                <div className="ml-2 flex-shrink-0 flex">
                                                    <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryColor(expense.category)}`}>
                                                        {expense.category}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-2 flex justify-between">
                                                <div className="sm:flex">
                                                    <p className="flex items-center text-sm text-gray-500">
                                                        {new Date(expense.date).toLocaleDateString('en-IN')}
                                                    </p>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                    <p className="text-lg font-bold text-gray-900">
                                                        ₹{expense.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </p>
                                                    <button
                                                        onClick={() => handleEdit(expense)}
                                                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(expense.id)}
                                                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>
        </DashboardLayout>
    );
}
