import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Activity, Database, CheckCircle, Package, TrendingUp, Cpu } from 'lucide-react';

export default function LandingPage() {
    // Stagger container animation
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
    };

    return (
        <div className="min-h-screen bg-[#060606] text-white font-sans overflow-x-hidden selection:bg-[#f97316] selection:text-black">
            {/* Raw Gridlines Background for Depth */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

            {/* Header Navigation */}
            <header className="border-b border-white/10 relative z-20 backdrop-blur-md bg-[#060606]/80">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-none bg-[#f97316] flex items-center justify-center text-black font-bold font-mono">
                            B
                        </div>
                        <span className="font-mono font-bold tracking-widest text-lg uppercase">
                            BIZ<span className="text-[#f97316]">TRACKR</span> PRO
                        </span>
                    </div>
                    <nav className="flex items-center gap-6">
                        <Link href="/login" passHref legacyBehavior>
                            <motion.a 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="font-mono text-sm border border-white/20 hover:border-[#f97316] hover:text-[#f97316] px-5 py-2.5 transition-colors duration-200 cursor-pointer"
                            >
                                ACCESS TERMINAL
                            </motion.a>
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10">
                {/* Hero Section */}
                <section className="max-w-7xl mx-auto px-6 pt-24 pb-20 flex flex-col items-center justify-center text-center">
                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="space-y-8 max-w-4xl"
                    >
                        {/* Monospace Badge */}
                        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 font-mono text-xs text-muted-foreground uppercase tracking-widest">
                            <span className="w-2 h-2 rounded-none bg-[#f97316] animate-pulse" />
                            v1.4.0 Live Deployment
                        </motion.div>

                        {/* Title - Typographic Brutalism */}
                        <motion.h1 
                            variants={itemVariants} 
                            className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-none font-mono"
                        >
                            Commerce <br />
                            <span className="text-[#f97316]">Operating System</span>
                        </motion.h1>

                        {/* Description */}
                        <motion.p 
                            variants={itemVariants} 
                            className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-sans leading-relaxed"
                        >
                            A service-oriented, multi-tenant ledger engineered for high-concurrency commerce operations. Built with Supabase Auth, Prisma, and robust PostgreSQL row-level isolation.
                        </motion.p>

                        {/* Call To Action Buttons */}
                        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <Link href="/login" passHref legacyBehavior>
                                <motion.a 
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full sm:w-auto bg-[#f97316] text-black font-mono font-bold px-8 py-4 flex items-center justify-center gap-3 transition-opacity duration-200 cursor-pointer"
                                >
                                    GET STARTED <ArrowRight className="w-5 h-5" />
                                </motion.a>
                            </Link>
                            <a 
                                href="#features"
                                className="w-full sm:w-auto border border-white/10 hover:border-white/30 text-gray-300 font-mono px-8 py-4 flex items-center justify-center transition-colors duration-200"
                            >
                                SYSTEM ARCHITECTURE
                            </a>
                        </motion.div>
                    </motion.div>
                </section>

                {/* System Specs Section - Staggered Asymmetrical Layout */}
                <section id="features" className="border-t border-white/10 py-24 bg-[#0a0a0a]/50">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                            {/* Monospace Sidebar Details */}
                            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
                                <span className="font-mono text-[#f97316] uppercase tracking-widest text-xs font-bold block">
                                    [ system specs ]
                                </span>
                                <h2 className="text-3xl md:text-4xl font-mono font-bold uppercase tracking-tight">
                                    Robust engine for enterprise ledgers.
                                </h2>
                                <p className="text-gray-400 font-sans leading-relaxed">
                                    BizTrackr PRO bypasses safe boilerplate configurations to deliver deep database isolation, microsecond latency, and fully audited transaction flows.
                                </p>
                            </div>

                            {/* Feature Cards - Brutalist Sharp Boxes */}
                            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Card 1 */}
                                <div className="border border-white/10 bg-[#0c0c0c] p-8 relative overflow-hidden group hover:border-[#f97316]/40 transition-colors duration-300">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Database className="w-24 h-24 text-white" />
                                    </div>
                                    <div className="p-3 bg-[#f97316]/10 text-[#f97316] w-fit mb-6">
                                        <Database className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-mono font-bold uppercase mb-2">Supabase Auth</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Decoupled identity provider with public-key JWT verification and instant serverless auto-provisioning.
                                    </p>
                                </div>

                                {/* Card 2 */}
                                <div className="border border-white/10 bg-[#0c0c0c] p-8 relative overflow-hidden group hover:border-[#f97316]/40 transition-colors duration-300">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Shield className="w-24 h-24 text-white" />
                                    </div>
                                    <div className="p-3 bg-[#f97316]/10 text-[#f97316] w-fit mb-6">
                                        <Shield className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-mono font-bold uppercase mb-2">Tenant Isolation</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Strict organization-level constraints mapped onto query execution pools, guaranteeing immutable isolation.
                                    </p>
                                </div>

                                {/* Card 3 */}
                                <div className="border border-white/10 bg-[#0c0c0c] p-8 relative overflow-hidden group hover:border-[#f97316]/40 transition-colors duration-300">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Package className="w-24 h-24 text-white" />
                                    </div>
                                    <div className="p-3 bg-[#f97316]/10 text-[#f97316] w-fit mb-6">
                                        <Package className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-mono font-bold uppercase mb-2">Inventory Sync</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Active connection inventory status checks with automatic low-stock triggers and supplier notifications.
                                    </p>
                                </div>

                                {/* Card 4 */}
                                <div className="border border-white/10 bg-[#0c0c0c] p-8 relative overflow-hidden group hover:border-[#f97316]/40 transition-colors duration-300">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Cpu className="w-24 h-24 text-white" />
                                    </div>
                                    <div className="p-3 bg-[#f97316]/10 text-[#f97316] w-fit mb-6">
                                        <Cpu className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-mono font-bold uppercase mb-2">AI Forecasting</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Embedded linear regression analysis to estimate future customer demand cycles and alert on cash flow.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/10 py-12 relative z-20">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-gray-500 text-xs font-mono">
                    <p>© 2026 BIZTRACKR SYSTEMS. IMMUTABLE COMMERCE PATENTS PENDING.</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-white transition-colors">SEC COMPLIANCE</a>
                        <a href="#" className="hover:text-white transition-colors">API SCHEMA</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
