import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsLoading(false);
        setIsSent(true);
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
                        Reset Password
                    </h1>
                    <p className="text-muted-foreground mt-2">Enter your email to receive reset instructions</p>
                </div>

                {!isSent ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
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

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary hover:opacity-90 text-primary-foreground font-medium py-3 rounded-xl shadow-lg shadow-primary/10 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Send Reset Link <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center space-y-4"
                    >
                        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground">Check your email</h3>
                        <p className="text-muted-foreground">
                            We have sent a password reset link to <strong>{email}</strong>
                        </p>
                    </motion.div>
                )}

                <div className="text-center mt-6">
                    <Link href="/login">
                        <a className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors text-sm">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
                        </a>
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
