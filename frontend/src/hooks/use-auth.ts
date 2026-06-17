import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '@/lib/axios';
import { supabase } from '@/lib/supabase';

interface User {
    id: number;
    email: string;
    full_name: string | null;
    role: 'admin' | 'manager' | 'cashier' | 'super_admin';
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
            setUser(null);
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

    // Listen to Supabase auth state change to sync tokens
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
            if (session) {
                localStorage.setItem('token', session.access_token);
                await fetchUserInfo();
            } else {
                localStorage.removeItem('token');
                setUser(null);
                setLoading(false);
            }
        });

        // Initial fetch
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                localStorage.setItem('token', session.access_token);
                await fetchUserInfo();
            } else {
                setLoading(false);
            }
        };
        checkSession();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.session) {
                localStorage.setItem('token', data.session.access_token);
                await fetchUserInfo();
            }

            router.push('/dashboard');
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message || 'Login failed' };
        }
    };

    const register = async (data: any) => {
        try {
            const { data: signUpData, error } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        full_name: data.full_name,
                    }
                }
            });

            if (error) throw error;

            // Trigger backend auto-provisioning by sending the token immediately if auto-logged in
            if (signUpData.session) {
                localStorage.setItem('token', signUpData.session.access_token);
                await fetchUserInfo();
            }

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message || 'Registration failed' };
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('token');
        setUser(null);
        router.push('/login');
    };

    const hasPermission = (permission: string) => {
        if (!user) return false;
        if (user.role === 'admin') return true; // Admin has all permissions implicitly or explicitly
        return user.permissions?.includes(permission) || false;
    };

    const updateProfile = async (data: { full_name?: string; email?: string }) => {
        try {
            const res = await api.put('/users/me', data);
            setUser(res.data);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.response?.data?.detail || 'Profile update failed' };
        }
    };

    const loginWithOAuth = async (provider: 'google' | 'github') => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/dashboard`
                }
            });
            if (error) throw error;
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message || 'OAuth login failed' };
        }
    };

    return { user, loading, login, register, logout, hasPermission, updateProfile, loginWithOAuth };
}
