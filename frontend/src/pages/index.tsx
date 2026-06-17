import { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Database, Package, Cpu, Calculator, Check, ExternalLink } from 'lucide-react';
import CookieConsent from '../components/ui/CookieConsent';

export default function LandingPage() {
    // Calculator States
    const [accounts, setAccounts] = useState(3);
    const [itemsCount, setItemsCount] = useState(250);
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

    // Simple pricing calculator logic
    const basePrice = billingPeriod === 'monthly' ? 29 : 24; // Pro base price
    const extraAccountsPrice = Math.max(0, accounts - 3) * 5;
    const extraItemsPrice = Math.max(0, Math.floor((itemsCount - 500) / 100)) * 2;
    const calculatedPrice = basePrice + extraAccountsPrice + extraItemsPrice;

    // Plan threshold thresholds
    const getSuggestedPlan = () => {
        if (accounts <= 1 && itemsCount <= 100) return 'Free';
        if (accounts <= 10 && itemsCount <= 2000) return 'Pro';
        return 'Enterprise';
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 18 } }
    };

    return (
        <div className="min-h-screen bg-[#080808] text-[#F4F4F0] font-sans overflow-x-hidden selection:bg-[#FF3300] selection:text-white relative">
            <Head>
                <title>BizTrackr PRO | Commerce Operating System</title>
                <meta name="description" content="A service-oriented, multi-tenant ledger engineered for high-concurrency commerce operations." />
            </Head>

            {/* Film Grain & Grid Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

            <header className="border-b border-white/10 relative z-20 backdrop-blur-md bg-[#080808]/80">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-none bg-[#FF3300] flex items-center justify-center text-white font-bold font-mono">
                            B
                        </div>
                        <span className="font-mono font-bold tracking-widest text-lg uppercase">
                            BIZ<span className="text-[#FF3300]">TRACKR</span> PRO
                        </span>
                    </div>
                    <nav className="flex items-center gap-6">
                        <Link href="/login" passHref legacyBehavior>
                            <motion.a 
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="font-mono text-xs border border-white/20 hover:border-[#FF3300] hover:text-[#FF3300] px-5 py-2.5 transition-colors duration-200 cursor-pointer"
                            >
                                ACCESS TERMINAL
                            </motion.a>
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="relative z-10">
                {/* Hero Section - Asymmetrical Typographic Focus */}
                <section className="max-w-7xl mx-auto px-6 pt-24 pb-20">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        <motion.div 
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            className="lg:col-span-8 space-y-8"
                        >
                            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 font-mono text-[10px] text-gray-400 uppercase tracking-widest">
                                <span className="w-2 h-2 rounded-none bg-[#FF3300] animate-pulse" />
                                production-ready system v1.4.0
                            </motion.div>

                            <motion.h1 
                                variants={itemVariants}
                                className="text-6xl md:text-8xl font-serif font-black tracking-tighter uppercase leading-none text-white"
                            >
                                Commerce <br />
                                <span className="text-[#FF3300]">Operating System</span>
                            </motion.h1>

                            <motion.p 
                                variants={itemVariants}
                                className="text-gray-400 text-lg md:text-xl max-w-2xl font-sans leading-relaxed"
                            >
                                A service-oriented, multi-tenant ledger engineered for high-concurrency commerce operations. Built with Supabase Auth, Prisma, and robust PostgreSQL row-level isolation.
                            </motion.p>

                            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                                <Link href="/register?tier=free" passHref legacyBehavior>
                                    <motion.a 
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full sm:w-auto bg-[#FF3300] text-white font-mono font-bold px-8 py-4 flex items-center justify-center gap-3 transition-colors duration-200 cursor-pointer"
                                    >
                                        INITIALIZE INSTANCE <ArrowRight className="w-5 h-5" />
                                    </motion.a>
                                </Link>
                                <a 
                                    href="#pricing-calculator"
                                    className="w-full sm:w-auto border border-white/10 hover:border-white/30 text-gray-300 font-mono px-8 py-4 flex items-center justify-center transition-colors duration-200"
                                >
                                    PLAN CALCULATOR
                                </a>
                            </motion.div>
                        </motion.div>

                        {/* System Specs Sidebar */}
                        <div className="lg:col-span-4 border-2 border-white/10 bg-[#1C1C1C] p-6 font-mono text-xs space-y-4">
                            <div className="border-b border-white/10 pb-3 font-bold text-[#FF3300]">
                                [ SYSTEM METRICS ]
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">DATABASE SCHEMA:</span>
                                <span className="text-white">POSTGRESQL + PRISMA</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">ISOLATION MODEL:</span>
                                <span className="text-white">TENANT ROUTING</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">LATENCY TARGET:</span>
                                <span className="text-white">&lt;80ms ENDPOINTS</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">AUTH PROVIDER:</span>
                                <span className="text-white">SUPABASE JWT</span>
                            </div>
                            <div className="border-t border-white/10 pt-3">
                                <p className="text-[10px] text-gray-500 leading-normal font-sans">
                                    Dynamic connection pooling and read replication enabled globally. Auto-scaling clusters are provisioned automatically upon subscription checkout.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Core Modules Grid */}
                <section className="border-t border-white/10 py-24 bg-[#0a0a0a]/30">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="space-y-4 mb-16">
                            <span className="font-mono text-[#FF3300] uppercase tracking-widest text-xs font-bold block">
                                [ core services ]
                            </span>
                            <h2 className="text-4xl md:text-5xl font-serif font-black uppercase tracking-tight text-white">
                                Built for Enterprise Stability.
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Card 1 */}
                            <div className="border border-white/10 bg-[#1C1C1C] p-8 relative overflow-hidden group hover:border-[#FF3300]/40 transition-colors duration-300">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Database className="w-24 h-24 text-white" />
                                </div>
                                <div className="p-3 bg-[#FF3300]/10 text-[#FF3300] w-fit mb-6">
                                    <Database className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-mono font-bold uppercase mb-2 text-white">Row Isolation</h3>
                                <p className="text-gray-400 text-xs leading-relaxed font-sans">
                                    Strict organization-level constraints mapped onto query execution pools, guaranteeing immutable tenant data isolation.
                                </p>
                            </div>

                            {/* Card 2 */}
                            <div className="border border-white/10 bg-[#1C1C1C] p-8 relative overflow-hidden group hover:border-[#FF3300]/40 transition-colors duration-300">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Shield className="w-24 h-24 text-white" />
                                </div>
                                <div className="p-3 bg-[#FF3300]/10 text-[#FF3300] w-fit mb-6">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-mono font-bold uppercase mb-2 text-white">JWT Authenticator</h3>
                                <p className="text-gray-400 text-xs leading-relaxed font-sans">
                                    Decoupled identity provider integration with public-key JWT verification and instant serverless auto-provisioning.
                                </p>
                            </div>

                            {/* Card 3 */}
                            <div className="border border-white/10 bg-[#1C1C1C] p-8 relative overflow-hidden group hover:border-[#FF3300]/40 transition-colors duration-300">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Package className="w-24 h-24 text-white" />
                                </div>
                                <div className="p-3 bg-[#FF3300]/10 text-[#FF3300] w-fit mb-6">
                                    <Package className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-mono font-bold uppercase mb-2 text-white">Inventory Sync</h3>
                                <p className="text-gray-400 text-xs leading-relaxed font-sans">
                                    Active connection inventory status checks with automatic low-stock triggers, restocking logs, and supplier links.
                                </p>
                            </div>

                            {/* Card 4 */}
                            <div className="border border-white/10 bg-[#1C1C1C] p-8 relative overflow-hidden group hover:border-[#FF3300]/40 transition-colors duration-300">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Cpu className="w-24 h-24 text-white" />
                                </div>
                                <div className="p-3 bg-[#FF3300]/10 text-[#FF3300] w-fit mb-6">
                                    <Cpu className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-mono font-bold uppercase mb-2 text-white">AI Forecasting</h3>
                                <p className="text-gray-400 text-xs leading-relaxed font-sans">
                                    Embedded linear regression analysis to estimate future customer demand cycles and alert on cash flow.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Interactive Pricing Calculator & Plan Showcase */}
                <section id="pricing-calculator" className="border-t border-white/10 py-24 bg-[#080808]">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                            {/* Left Side: Pricing Calculator */}
                            <div className="lg:col-span-7 space-y-8">
                                <div className="space-y-3">
                                    <span className="font-mono text-[#FF3300] uppercase tracking-widest text-xs font-bold block">
                                        [ scale simulator ]
                                    </span>
                                    <h2 className="text-3xl md:text-5xl font-serif font-black uppercase text-white">
                                        Configure Your Scope
                                    </h2>
                                    <p className="text-gray-400 text-sm font-sans max-w-xl">
                                        Billing is tier-based but scales dynamically if your operations require extra capacity. Pay for exactly what your ledger demands.
                                    </p>
                                </div>

                                {/* Billing Period Toggle */}
                                <div className="flex items-center gap-4 bg-[#1C1C1C] p-1.5 border border-white/10 w-fit">
                                    <button
                                        onClick={() => setBillingPeriod('monthly')}
                                        className={`px-4 py-2 text-xs font-mono font-bold uppercase transition-colors cursor-pointer ${
                                            billingPeriod === 'monthly' ? 'bg-[#FF3300] text-white' : 'text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        Monthly Billing
                                    </button>
                                    <button
                                        onClick={() => setBillingPeriod('yearly')}
                                        className={`px-4 py-2 text-xs font-mono font-bold uppercase transition-colors cursor-pointer ${
                                            billingPeriod === 'yearly' ? 'bg-[#FF3300] text-white' : 'text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        Yearly Billing (Save 20%)
                                    </button>
                                </div>

                                {/* Sliders */}
                                <div className="space-y-6 bg-[#1C1C1C] p-6 border border-white/10">
                                    {/* Accounts Slider */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between font-mono text-xs">
                                            <span className="text-gray-400 uppercase">Organization Accounts:</span>
                                            <span className="text-white font-bold">{accounts} Users</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1"
                                            max="30"
                                            value={accounts}
                                            onChange={(e) => setAccounts(parseInt(e.target.value))}
                                            className="w-full h-1 bg-white/10 appearance-none cursor-pointer accent-[#FF3300]"
                                        />
                                        <div className="flex justify-between font-mono text-[10px] text-gray-500">
                                            <span>1 Account (Free Limit)</span>
                                            <span>30 Accounts</span>
                                        </div>
                                    </div>

                                    {/* Inventory Catalog size */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between font-mono text-xs">
                                            <span className="text-gray-400 uppercase">Inventory Catalog:</span>
                                            <span className="text-white font-bold">{itemsCount} Unique Items</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="50"
                                            max="5000"
                                            step="50"
                                            value={itemsCount}
                                            onChange={(e) => setItemsCount(parseInt(e.target.value))}
                                            className="w-full h-1 bg-white/10 appearance-none cursor-pointer accent-[#FF3300]"
                                        />
                                        <div className="flex justify-between font-mono text-[10px] text-gray-500">
                                            <span>100 Items (Free Limit)</span>
                                            <span>5,000 Items</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Calculator Result Widget */}
                                <div className="border border-[#FF3300]/30 bg-[#FF3300]/5 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="space-y-1">
                                        <span className="font-mono text-[10px] text-[#FF3300] uppercase tracking-widest font-bold flex items-center gap-1.5">
                                            <Calculator className="w-3.5 h-3.5" /> EST. MONTHLY RATE
                                        </span>
                                        <div className="text-3xl font-mono font-black text-white">
                                            ${calculatedPrice}
                                            <span className="text-xs text-gray-400 font-sans font-normal"> / month</span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 font-mono">
                                            Suggested Profile: <span className="text-white uppercase font-bold">{getSuggestedPlan()} Tier</span>
                                        </p>
                                    </div>
                                    <Link href={`/register?tier=${getSuggestedPlan().toLowerCase()}`} passHref legacyBehavior>
                                        <button className="w-full sm:w-auto px-6 py-3 bg-[#FF3300] hover:bg-[#E02D00] text-white font-mono text-xs font-bold uppercase flex items-center justify-center gap-2 cursor-pointer transition-colors">
                                            Deploy Suggested Plan <ExternalLink className="w-3.5 h-3.5" />
                                        </button>
                                    </Link>
                                </div>
                            </div>

                            {/* Right Side: Static Plan Tiers Showcase */}
                            <div className="lg:col-span-5 space-y-6">
                                {/* Free Tier Card */}
                                <div className="border border-white/10 bg-[#1C1C1C] p-6 relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-mono font-bold text-white uppercase text-sm">Free Tier</h3>
                                            <p className="text-[10px] text-gray-500 font-sans">Basic single-user fulfillment</p>
                                        </div>
                                        <span className="text-lg font-mono font-black text-white">$0</span>
                                    </div>
                                    <ul className="space-y-2 text-xs text-gray-400 font-mono border-t border-white/5 pt-4">
                                        <li className="flex items-center gap-2">
                                            <Check className="w-3 h-3 text-[#FF3300]" /> 1 Workspace Account
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="w-3 h-3 text-[#FF3300]" /> Max 100 Inventory Items
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="w-3 h-3 text-[#FF3300]" /> Basic Sales & Purchase logs
                                        </li>
                                    </ul>
                                </div>

                                {/* Pro Tier Card */}
                                <div className="border-2 border-[#FF3300]/40 bg-[#1C1C1C] p-6 relative">
                                    <span className="absolute top-0 right-6 -translate-y-1/2 px-2 py-0.5 bg-[#FF3300] text-white font-mono text-[9px] uppercase tracking-widest font-bold">
                                        most popular
                                    </span>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-mono font-bold text-white uppercase text-sm">Pro Tier</h3>
                                            <p className="text-[10px] text-gray-500 font-sans">Collaborative inventory & audits</p>
                                        </div>
                                        <span className="text-lg font-mono font-black text-white">$29</span>
                                    </div>
                                    <ul className="space-y-2 text-xs text-gray-400 font-mono border-t border-white/5 pt-4">
                                        <li className="flex items-center gap-2">
                                            <Check className="w-3 h-3 text-[#FF3300]" /> Max 10 Workspace Accounts
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="w-3 h-3 text-[#FF3300]" /> Max 2,000 Inventory Items
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="w-3 h-3 text-[#FF3300]" /> Dynamic AI Demand Forecasts
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="w-3 h-3 text-[#FF3300]" /> PDF stream invoice exporting
                                        </li>
                                    </ul>
                                </div>

                                {/* Enterprise Tier Card */}
                                <div className="border border-white/10 bg-[#1C1C1C] p-6 relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-mono font-bold text-white uppercase text-sm">Enterprise</h3>
                                            <p className="text-[10px] text-gray-500 font-sans">High-concurrency global catalogs</p>
                                        </div>
                                        <span className="text-lg font-mono font-black text-white">Custom</span>
                                    </div>
                                    <ul className="space-y-2 text-xs text-gray-400 font-mono border-t border-white/5 pt-4">
                                        <li className="flex items-center gap-2">
                                            <Check className="w-3 h-3 text-[#FF3300]" /> Unlimited accounts & workspaces
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="w-3 h-3 text-[#FF3300]" /> Unlimited items & transactions
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="w-3 h-3 text-[#FF3300]" /> Dedicated priority gateway access
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/10 py-16 relative z-20">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-gray-500 text-xs font-mono">
                    <p>© 2026 BIZTRACKR SYSTEMS. IMMUTABLE COMMERCE PATENTS PENDING.</p>
                    <div className="flex gap-6">
                        <Link href="/privacy-policy" passHref legacyBehavior>
                            <a className="hover:text-white transition-colors uppercase">PRIVACY POLICY (GDPR)</a>
                        </Link>
                        <Link href="/terms-of-service" passHref legacyBehavior>
                            <a className="hover:text-white transition-colors uppercase">TERMS OF SERVICE</a>
                        </Link>
                    </div>
                </div>
            </footer>

            {/* Cookie consent banner overlay */}
            <CookieConsent />
        </div>
    );
}
