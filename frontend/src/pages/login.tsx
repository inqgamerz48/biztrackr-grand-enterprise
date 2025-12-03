import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import api from '@/lib/axios';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader2, Github, Chrome } from 'lucide-react';
import { useRouter } from 'next/router';

import { useGoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const loginGoogle = useGoogleLogin({
        onSuccess: (tokenResponse) => {
            // Send access token to backend
            api.post('/auth/login/google', null, { params: { token: tokenResponse.access_token } })
                .then((res: any) => {
                    localStorage.setItem('token', res.data.access_token);
                    window.location.href = '/dashboard';
                })
                .catch((err: any) => setError(err.response?.data?.detail || 'Google Login Failed'));
        },
        onError: () => setError('Google Login Failed'),
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        const res = await login(email, password);
        if (!res.success) {
            setError(res.error);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background overflow-hidden relative transition-colors duration-300">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md p-8 bg-card border border-border rounded-2xl relative z-10 mx-4 shadow-xl"
            >
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-foreground">
                        Welcome Back
                    </h1>
                    <p className="text-muted-foreground mt-2">Sign in to access your dashboard</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center"
                        >
                            {error}
                        </motion.div>
                    )}

                    <div className="space-y-4">
                        <div className="relative group">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-5 h-5" />
                            <input
                                type="email"
                                required
                                className="w-full bg-muted/50 border border-border rounded-xl py-3 pl-10 pr-4 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-5 h-5" />
                            <input
                                type="password"
                                required
                                className="w-full bg-muted/50 border border-border rounded-xl py-3 pl-10 pr-4 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center space-x-2 cursor-pointer group">
                            <input type="checkbox" className="w-4 h-4 rounded border-border bg-muted text-primary focus:ring-primary transition-colors" />
                            <span className="text-muted-foreground group-hover:text-foreground transition-colors">Remember me</span>
                        </label>
                        <Link href="/forgot-password">
                            <a className="text-primary hover:underline transition-colors">Forgot Password?</a>
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary hover:opacity-90 text-primary-foreground font-medium py-3 rounded-xl shadow-lg shadow-primary/10 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Signing in...</span>
                            </>
                        ) : (
                            <>
                                Sign In <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-card text-muted-foreground">Or continue with</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => {
                                // MOCK: Simulate GitHub login
                                const mockCode = "mock_github_code_testuser";
                                api.post('/auth/login/github', null, { params: { code: mockCode } })
                                    .then((res: any) => {
                                        localStorage.setItem('token', res.data.access_token);
                                        window.location.href = '/dashboard';
                                    })
                                    .catch((err: any) => setError(err.response?.data?.detail || 'GitHub Login Failed'));
                            }}
                            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-muted/50 border border-border hover:bg-muted hover:border-primary/50 text-muted-foreground hover:text-foreground transition-all group"
                        >
                            <Github className="w-5 h-5 group-hover:text-foreground transition-colors" />
                            <span className="group-hover:text-foreground transition-colors">GitHub</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => loginGoogle()}
                            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-muted/50 border border-border hover:bg-muted hover:border-primary/50 text-muted-foreground hover:text-foreground transition-all group"
                        >
                            <Chrome className="w-5 h-5 group-hover:text-foreground transition-colors" />
                            <span className="group-hover:text-foreground transition-colors">Google</span>
                        </button>
                    </div>

                    <div className="text-center mt-6">
                        <p className="text-muted-foreground text-sm">
                            Don't have an account?{' '}
                            <Link href="/register">
                                <a className="text-primary hover:underline font-medium transition-colors">
                                    Create account
                                </a>
                            </Link>
                        </p>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
