import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import api from '@/lib/axios';
import { Plus, Edit, Trash2, Check, Shield } from 'lucide-react';

interface Permission {
    id: number;
    code: string;
    description: string;
}

interface Role {
    id: number;
    name: string;
    permissions: Permission[];
}

export default function RolesPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [formData, setFormData] = useState({ name: '', permissions: [] as string[] });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [rolesRes, permsRes] = await Promise.all([
                api.get('/roles/'),
                api.get('/roles/permissions')
            ]);
            setRoles(rolesRes.data);
            setAllPermissions(permsRes.data);
        } catch (error) {
            console.error('Failed to fetch roles data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingRole) {
                await api.put(`/roles/${editingRole.id}`, formData);
            } else {
                await api.post('/roles/', formData);
            }
            setShowModal(false);
            setEditingRole(null);
            setFormData({ name: '', permissions: [] });
            fetchData();
        } catch (error) {
            console.error('Failed to save role', error);
            alert('Failed to save role');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this role?')) return;
        try {
            await api.delete(`/roles/${id}`);
            fetchData();
        } catch (error) {
            console.error('Failed to delete role', error);
            alert('Failed to delete role. Ensure no users are assigned to it.');
        }
    };

    const openModal = (role?: Role) => {
        if (role) {
            setEditingRole(role);
            setFormData({
                name: role.name,
                permissions: role.permissions.map(p => p.code)
            });
        } else {
            setEditingRole(null);
            setFormData({ name: '', permissions: [] });
        }
        setShowModal(true);
    };

    const togglePermission = (code: string) => {
        setFormData(prev => {
            const newPerms = prev.permissions.includes(code)
                ? prev.permissions.filter(p => p !== code)
                : [...prev.permissions, code];
            return { ...prev, permissions: newPerms };
        });
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Roles & Permissions</h1>
                        <p className="text-sm text-gray-500">Manage user roles and access control.</p>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Create Role
                    </button>
                </div>

                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    {loading ? (
                        <div className="p-6 text-center text-gray-500">Loading roles...</div>
                    ) : (
                        <ul className="divide-y divide-gray-200">
                            {roles.map((role) => (
                                <li key={role.id} className="p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-3">
                                                <Shield className="h-5 w-5 text-indigo-500" />
                                                <h3 className="text-lg font-medium text-gray-900">{role.name}</h3>
                                            </div>
                                            <div className="mt-2">
                                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Permissions</h4>
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {role.permissions.map(p => (
                                                        <span key={p.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                            {p.description || p.code}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4 ml-4">
                                            <button
                                                onClick={() => openModal(role)}
                                                className="text-indigo-600 hover:text-indigo-900"
                                            >
                                                <Edit className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(role.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="fixed z-10 inset-0 overflow-y-auto">
                        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)}></div>

                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full sm:p-6">
                                <div>
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                                        {editingRole ? 'Edit Role' : 'Create New Role'}
                                    </h3>
                                    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Role Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-md">
                                                {allPermissions.map((perm) => (
                                                    <div key={perm.id} className="flex items-start">
                                                        <div className="flex items-center h-5">
                                                            <input
                                                                id={`perm-${perm.id}`}
                                                                type="checkbox"
                                                                checked={formData.permissions.includes(perm.code)}
                                                                onChange={() => togglePermission(perm.code)}
                                                                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                                            />
                                                        </div>
                                                        <div className="ml-3 text-sm">
                                                            <label htmlFor={`perm-${perm.id}`} className="font-medium text-gray-700">
                                                                {perm.description || perm.code}
                                                            </label>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                                            <button
                                                type="submit"
                                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                                            >
                                                Save
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowModal(false)}
                                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
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
