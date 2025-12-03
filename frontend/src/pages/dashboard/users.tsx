import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import api from '@/lib/axios';
import { useRouter } from 'next/router';

interface User {
    id: number;
    email: string;
    full_name: string | null;
    role: 'admin' | 'manager' | 'cashier';
    is_active: boolean;
    is_superuser: boolean;
    tenant_id: number | null;
}

export default function UsersPage() {
    const { user: currentUser } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newUser, setNewUser] = useState({
        email: '',
        password: '',
        full_name: '',
        role: 'cashier'
    });

    useEffect(() => {
        // Redirect if not admin or manager
        if (currentUser && currentUser.role !== 'admin' && currentUser.role !== 'manager') {
            router.push('/dashboard');
            return;
        }

        fetchUsers();
    }, [currentUser]);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users/');
            setUsers(res.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const showSuccess = (message: string) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const showError = (message: string) => {
        setError(message);
        setTimeout(() => setError(''), 3000);
    };

    const updateUserRole = async (userId: number, newRole: string, userEmail: string) => {
        // Only admins can change roles
        if (currentUser?.role !== 'admin') {
            showError('Only admins can change user roles');
            return;
        }

        try {
            await api.put(`/users/${userId}/role`, { role: newRole });
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
            showSuccess(`✅ Updated ${userEmail} to ${newRole.toUpperCase()} role`);
        } catch (err: any) {
            showError(err.response?.data?.detail || 'Failed to update role');
        }
    };

    const toggleUserActivation = async (userId: number, isActive: boolean, userEmail: string) => {
        // Only admins can activate/deactivate
        if (currentUser?.role !== 'admin') {
            showError('Only admins can activate/deactivate users');
            return;
        }

        try {
            await api.put(`/users/${userId}/activate`, { is_active: !isActive });
            setUsers(users.map(u => u.id === userId ? { ...u, is_active: !isActive } : u));
            const status = !isActive ? 'activated' : 'deactivated';
            showSuccess(`✅ Successfully ${status} ${userEmail}`);
        } catch (err: any) {
            showError(err.response?.data?.detail || 'Failed to update activation');
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/users/', newUser);
            showSuccess(`✅ Successfully created user ${newUser.email}`);
            setIsModalOpen(false);
            setNewUser({ email: '', password: '', full_name: '', role: 'cashier' });
            fetchUsers();
        } catch (err: any) {
            showError(err.response?.data?.detail || 'Failed to create user');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-gray-600">Loading users...</div>
            </div>
        );
    }

    const isAdmin = currentUser?.role === 'admin';

    return (
        <div className="p-8">
            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">User Management</h1>
                    <p className="text-gray-400 mt-2">
                        {isAdmin ? 'Manage user roles and permissions' : 'View team members (Manager)'}
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors flex items-center justify-center gap-2 border border-white/20"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Dashboard
                    </button>
                    {isAdmin && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-md transition-colors flex items-center justify-center gap-2 border border-white"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add User
                        </button>
                    )}
                </div>
            </div>

            {/* Success Message */}
            {successMessage && (
                <div className="mb-4 p-4 bg-white/10 border border-white/20 rounded-md animate-fade-in">
                    <p className="text-white font-medium">{successMessage}</p>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-4 bg-white/10 border border-white/20 rounded-md animate-fade-in">
                    <p className="text-white font-medium">{error}</p>
                </div>
            )}

            {/* Desktop Table */}
            <div className="hidden md:block bg-black shadow-none rounded-lg overflow-hidden border border-white/20">
                <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-white/5">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-black divide-y divide-white/10">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div>
                                            <div className="text-sm font-medium text-white">{user.email}</div>
                                            <div className="text-sm text-gray-400">{user.full_name || 'No name'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <select
                                        value={user.role}
                                        onChange={(e) => updateUserRole(user.id, e.target.value, user.email)}
                                        disabled={!isAdmin || user.id === currentUser?.id}
                                        className={`text-sm border rounded px-2 py-1 transition-all ${user.role === 'admin' ? 'bg-white/10 text-white border-white/20' :
                                            user.role === 'manager' ? 'bg-white/10 text-white border-white/20' :
                                                'bg-white/10 text-white border-white/20'
                                            } ${!isAdmin || user.id === currentUser?.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}`}
                                    >
                                        <option value="admin" className="bg-black text-white">Admin</option>
                                        <option value="manager" className="bg-black text-white">Manager</option>
                                        <option value="cashier" className="bg-black text-white">Cashier</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active ? 'bg-white/10 text-white border border-white/20' : 'bg-white/10 text-white border border-white/20'
                                        }`}>
                                        {user.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button
                                        onClick={() => toggleUserActivation(user.id, user.is_active, user.email)}
                                        disabled={!isAdmin || user.id === currentUser?.id}
                                        className={`px-3 py-1 rounded ${!isAdmin || user.id === currentUser?.id
                                            ? 'opacity-50 cursor-not-allowed text-gray-400'
                                            : user.is_active
                                                ? 'text-white hover:bg-white/10'
                                                : 'text-white hover:bg-white/10'
                                            } transition-colors border border-white/20`}
                                    >
                                        {user.is_active ? 'Deactivate' : 'Activate'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile List View */}
            <div className="md:hidden space-y-4">
                {users.map((user) => (
                    <div key={user.id} className="bg-black border border-white/20 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="text-sm font-medium text-white">{user.email}</div>
                                <div className="text-sm text-gray-400">{user.full_name || 'No name'}</div>
                            </div>
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active ? 'bg-white/10 text-white border border-white/20' : 'bg-white/10 text-white border border-white/20'
                                }`}>
                                {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>

                        <div className="flex items-center justify-between gap-4 pt-2 border-t border-white/10">
                            <div className="flex-1">
                                <label className="text-xs text-gray-400 block mb-1">Role</label>
                                <select
                                    value={user.role}
                                    onChange={(e) => updateUserRole(user.id, e.target.value, user.email)}
                                    disabled={!isAdmin || user.id === currentUser?.id}
                                    className={`w-full text-sm border rounded px-2 py-1 transition-all ${user.role === 'admin' ? 'bg-white/10 text-white border-white/20' :
                                        user.role === 'manager' ? 'bg-white/10 text-white border-white/20' :
                                            'bg-white/10 text-white border-white/20'
                                        } ${!isAdmin || user.id === currentUser?.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                    <option value="admin" className="bg-black text-white">Admin</option>
                                    <option value="manager" className="bg-black text-white">Manager</option>
                                    <option value="cashier" className="bg-black text-white">Cashier</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Action</label>
                                <button
                                    onClick={() => toggleUserActivation(user.id, user.is_active, user.email)}
                                    disabled={!isAdmin || user.id === currentUser?.id}
                                    className={`w-full px-3 py-1 rounded text-sm ${!isAdmin || user.id === currentUser?.id
                                        ? 'opacity-50 cursor-not-allowed text-gray-400'
                                        : user.is_active
                                            ? 'text-white hover:bg-white/10'
                                            : 'text-white hover:bg-white/10'
                                        } transition-colors border border-white/20`}
                                >
                                    {user.is_active ? 'Deactivate' : 'Activate'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 bg-white/5 border border-white/20 rounded-md p-4">
                <h3 className="text-sm font-medium text-white mb-2">Role Permissions:</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                    <li><strong>Admin:</strong> Full access to all features including user management, settings, and billing</li>
                    <li><strong>Manager:</strong> Access to operations (sales, purchases, inventory, CRM, expenses, reports)</li>
                    <li><strong>Cashier:</strong> Limited to creating sales and viewing inventory (read-only)</li>
                </ul>
            </div>

            {/* Add User Modal */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-black border border-white/20 rounded-lg p-8 max-w-md w-full">
                            <h2 className="text-2xl font-bold mb-6 text-white">Add New User</h2>
                            <form onSubmit={handleCreateUser}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-black text-white border border-white/20 rounded-md px-3 py-2 focus:ring-white focus:border-white"
                                        value={newUser.email}
                                        onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-black text-white border border-white/20 rounded-md px-3 py-2 focus:ring-white focus:border-white"
                                        value={newUser.full_name}
                                        onChange={e => setNewUser({ ...newUser, full_name: e.target.value })}
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                                    <input
                                        type="password"
                                        required
                                        className="w-full bg-black text-white border border-white/20 rounded-md px-3 py-2 focus:ring-white focus:border-white"
                                        value={newUser.password}
                                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                    />
                                </div>
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                                    <select
                                        className="w-full bg-black text-white border border-white/20 rounded-md px-3 py-2 focus:ring-white focus:border-white"
                                        value={newUser.role}
                                        onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                    >
                                        <option value="manager">Manager</option>
                                        <option value="cashier">Cashier</option>
                                    </select>
                                </div>
                                <div className="flex justify-end gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 text-gray-300 hover:bg-white/10 rounded-md border border-white/20"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200 border border-white"
                                    >
                                        Create User
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
