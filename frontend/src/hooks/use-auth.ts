import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '@/lib/axios';

interface User {
    id: number;
    email: string;
    full_name: string | null;
    role: 'admin' | 'manager' | 'cashier';
    permissions: string[];
    is_active: boolean;
    is_superuser: boolean;
    tenant_id: number | null;
}

export function useAuth() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUserInfo = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            // Fetch full user info including role from /users/me
            const res = await api.get('/users/me');
            setUser(res.data);
        } catch (error) {
            console.error('Failed to fetch user info:', error);
            // Token might be invalid, clear it
            localStorage.removeItem('token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserInfo();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const formData = new FormData();
            formData.append('username', email);
            formData.append('password', password);

            const res = await api.post('/auth/login/access-token', formData);
            const { access_token } = res.data;

            localStorage.setItem('token', access_token);

            // Fetch user info after login
            await fetchUserInfo();

            router.push('/dashboard');
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.response?.data?.detail || 'Login failed' };
        }
    };

    const register = async (data: any) => {
        try {
            await api.post('/auth/register', data);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.response?.data?.detail || 'Registration failed' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        router.push('/login');
    };

    const hasPermission = (permission: string) => {
        if (!user) return false;
        if (user.role === 'admin') return true; // Admin has all permissions implicitly or explicitly
        return user.permissions?.includes(permission) || false;
    };

    return { user, loading, login, register, logout, hasPermission };
}
