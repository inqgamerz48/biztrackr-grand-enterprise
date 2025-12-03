import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import api from '@/lib/axios';
import { Plus, Edit, Trash2, Check, MapPin, Phone } from 'lucide-react';

interface Branch {
    id: number;
    name: string;
    address: string;
    phone: string;
    is_main: boolean;
}

export default function BranchesPage() {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [formData, setFormData] = useState({ name: '', address: '', phone: '', is_main: false });

    useEffect(() => {
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        try {
            const res = await api.get('/branches/');
            setBranches(res.data);
        } catch (error) {
            console.error('Failed to fetch branches', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingBranch) {
                await api.put(`/branches/${editingBranch.id}`, formData);
            } else {
                await api.post('/branches/', formData);
            }
            setShowModal(false);
            setEditingBranch(null);
            setFormData({ name: '', address: '', phone: '', is_main: false });
            fetchBranches();
        } catch (error) {
            console.error('Failed to save branch', error);
            alert('Failed to save branch');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this branch?')) return;
        try {
            await api.delete(`/branches/${id}`);
            fetchBranches();
        } catch (error) {
            console.error('Failed to delete branch', error);
            alert('Failed to delete branch. Ensure it is not the main branch.');
        }
    };

    const openModal = (branch?: Branch) => {
        if (branch) {
            setEditingBranch(branch);
            setFormData({
                name: branch.name,
                address: branch.address || '',
                phone: branch.phone || '',
                is_main: branch.is_main
            });
        } else {
            setEditingBranch(null);
            setFormData({ name: '', address: '', phone: '', is_main: false });
        }
        setShowModal(true);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-white">Branch Management</h1>
                        <p className="text-sm text-gray-400">Manage your business locations and branches.</p>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-black bg-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Branch
                    </button>
                </div>

                <div className="bg-black border border-white/20 shadow-none overflow-hidden sm:rounded-lg">
                    {loading ? (
                        <div className="p-6 text-center text-gray-400">Loading branches...</div>
                    ) : (
                        <ul className="divide-y divide-white/10">
                            {branches.map((branch) => (
                                <li key={branch.id} className="p-6 hover:bg-white/5 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-3">
                                                <h3 className="text-lg font-medium text-white">{branch.name}</h3>
                                                {branch.is_main && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white border border-white/20">
                                                        Main Branch
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                                                <div className="mt-2 flex items-center text-sm text-gray-400">
                                                    <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-500" />
                                                    {branch.address || 'No address provided'}
                                                </div>
                                                <div className="mt-2 flex items-center text-sm text-gray-400">
                                                    <Phone className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-500" />
                                                    {branch.phone || 'No phone provided'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <button
                                                onClick={() => openModal(branch)}
                                                className="text-white hover:text-gray-300"
                                            >
                                                <Edit className="h-5 w-5" />
                                            </button>
                                            {!branch.is_main && (
                                                <button
                                                    onClick={() => handleDelete(branch.id)}
                                                    className="text-white hover:text-gray-300"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="fixed z-50 inset-0 overflow-y-auto">
                        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)}></div>

                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                            <div className="inline-block align-bottom bg-black border border-white/20 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                                <div>
                                    <h3 className="text-lg leading-6 font-medium text-white">
                                        {editingBranch ? 'Edit Branch' : 'Add New Branch'}
                                    </h3>
                                    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300">Branch Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="mt-1 block w-full bg-white/5 border border-white/20 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-white focus:border-white sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300">Address</label>
                                            <input
                                                type="text"
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                className="mt-1 block w-full bg-white/5 border border-white/20 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-white focus:border-white sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300">Phone</label>
                                            <input
                                                type="text"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="mt-1 block w-full bg-white/5 border border-white/20 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-white focus:border-white sm:text-sm"
                                            />
                                        </div>
                                        <div className="flex items-center">
                                            <input
                                                id="is_main"
                                                type="checkbox"
                                                checked={formData.is_main}
                                                onChange={(e) => setFormData({ ...formData, is_main: e.target.checked })}
                                                className="h-4 w-4 text-black focus:ring-white border-white/20 rounded bg-white/10"
                                            />
                                            <label htmlFor="is_main" className="ml-2 block text-sm text-gray-300">
                                                Set as Main Branch
                                            </label>
                                        </div>
                                        <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                                            <button
                                                type="submit"
                                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-white text-base font-medium text-black hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white sm:col-start-2 sm:text-sm"
                                            >
                                                Save
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowModal(false)}
                                                className="mt-3 w-full inline-flex justify-center rounded-md border border-white/20 shadow-sm px-4 py-2 bg-black text-base font-medium text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white sm:mt-0 sm:col-start-1 sm:text-sm"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
