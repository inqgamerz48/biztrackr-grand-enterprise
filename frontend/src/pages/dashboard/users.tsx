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
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-600 mt-2">
                        {isAdmin ? 'Manage user roles and permissions' : 'View team members (Manager)'}
                    </p>
                </div>
                <button
                    onClick={() => router.push('/dashboard')}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Dashboard
                </button>
                {isAdmin && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="ml-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add User
                    </button>
                )}
            </div>

            {/* Success Message */}
            {successMessage && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md animate-fade-in">
                    <p className="text-green-800 font-medium">{successMessage}</p>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md animate-fade-in">
                    <p className="text-red-800 font-medium">{error}</p>
                </div>
            )}

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{user.email}</div>
                                            <div className="text-sm text-gray-500">{user.full_name || 'No name'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <select
                                        value={user.role}
                                        onChange={(e) => updateUserRole(user.id, e.target.value, user.email)}
                                        disabled={!isAdmin || user.id === currentUser?.id}
                                        className={`text-sm border rounded px-2 py-1 transition-all ${user.role === 'admin' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                                            user.role === 'manager' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                                                'bg-green-50 text-green-800 border-green-200'
                                            } ${!isAdmin || user.id === currentUser?.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}`}
                                    >
                                        <option value="admin">Admin</option>
                                        <option value="manager">Manager</option>
                                        <option value="cashier">Cashier</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
                                                ? 'text-red-600 hover:bg-red-50 hover:text-red-800'
                                                : 'text-green-600 hover:bg-green-50 hover:text-green-800'
                                            } transition-colors`}
                                    >
                                        {user.is_active ? 'Deactivate' : 'Activate'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Role Permissions:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li><strong>Admin:</strong> Full access to all features including user management, settings, and billing</li>
                    <li><strong>Manager:</strong> Access to operations (sales, purchases, inventory, CRM, expenses, reports)</li>
                    <li><strong>Cashier:</strong> Limited to creating sales and viewing inventory (read-only)</li>
                </ul>
            </div>

            {/* Add User Modal */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-8 max-w-md w-full">
                            <h2 className="text-2xl font-bold mb-6">Add New User</h2>
                            <form onSubmit={handleCreateUser}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full border rounded-md px-3 py-2"
                                        value={newUser.email}
                                        onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full border rounded-md px-3 py-2"
                                        value={newUser.full_name}
                                        onChange={e => setNewUser({ ...newUser, full_name: e.target.value })}
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <input
                                        type="password"
                                        required
                                        className="w-full border rounded-md px-3 py-2"
                                        value={newUser.password}
                                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                    />
                                </div>
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                    <select
                                        className="w-full border rounded-md px-3 py-2"
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
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
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
