import Link from 'next/link';
import Head from 'next/head';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-[#080808] text-[#F4F4F0] font-sans selection:bg-[#FF3300] selection:text-white relative">
            <Head>
                <title>Terms of Service | BizTrackr PRO</title>
                <meta name="description" content="Subscription agreement and Terms of Service for BizTrackr Pro." />
            </Head>

            {/* Blueprint Grid Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

            <header className="border-b border-white/10 relative z-20 backdrop-blur-md bg-[#080808]/80">
                <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" passHref legacyBehavior>
                        <a className="flex items-center gap-2 font-mono text-xs text-gray-400 hover:text-[#FF3300] transition-colors">
                            <ArrowLeft className="w-4 h-4" /> BACK TO TERMINAL
                        </a>
                    </Link>
                    <span className="font-mono text-[10px] tracking-widest text-[#FF3300] uppercase font-bold">
                        [ COMPLIANCE REGISTRY ]
                    </span>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-20 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-12"
                >
                    <div className="space-y-4 border-b border-white/10 pb-8">
                        <span className="font-mono text-xs text-[#FF3300] uppercase tracking-widest">
                            Last Modified: June 17, 2026
                        </span>
                        <h1 className="text-4xl md:text-6xl font-serif font-black tracking-tight text-white uppercase">
                            Terms of Service
                        </h1>
                        <p className="text-gray-400 font-mono text-sm">
                            DOCUMENT REF: BIZ-SEC-TERMS-2026
                        </p>
                    </div>

                    <div className="space-y-8 font-sans text-gray-300 leading-relaxed text-sm md:text-base">
                        <section className="space-y-4">
                            <h2 className="text-xl md:text-2xl font-serif text-white uppercase tracking-tight">
                                1. Subscription Agreements & Licensing
                            </h2>
                            <p>
                                BizTrackr PRO operates on a subscription-as-a-service basis. By opening an organization account, you agree to comply with your designated tier limits:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 font-mono text-xs text-gray-400">
                                <li><strong>Free Tier</strong>: Single workspace, restricted account profiles, and maximum inventory items limits.</li>
                                <li><strong>Pro Tier</strong>: Multi-workspace collaboration, extended item catalog, and automated forecasting runs.</li>
                                <li><strong>Enterprise Tier</strong>: Unlimited transactions, priority API capacity, custom reports, and strict SLA assurances.</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl md:text-2xl font-serif text-white uppercase tracking-tight">
                                2. Billing, Payments & Cancellations
                            </h2>
                            <p>
                                Subscription upgrades can be processed via external payment processors (e.g., Razorpay). Upgrades apply instantly upon gateway confirmation. Fees are non-refundable unless verified through a billing error. You are free to downgrade back to the Free Tier at any time, subject to data/limit truncations.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl md:text-2xl font-serif text-white uppercase tracking-tight">
                                3. Acceptable Use Policy
                            </h2>
                            <p>
                                You agree not to attempt security penetration audits without explicit authorization, trigger volumetric exhaustion attacks against our API gateways, or store illegal inventory/records inside tenant schema blocks.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl md:text-2xl font-serif text-white uppercase tracking-tight">
                                4. System Integrity and Backups
                            </h2>
                            <p>
                                While we execute daily transactional database backups via Supabase PostgreSQL replication, you hold final accountability for keeping local mirrors of your financial ledger, inventory valuations, and supplier transactions.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl md:text-2xl font-serif text-white uppercase tracking-tight">
                                5. Termination & Access Discontinuation
                            </h2>
                            <p>
                                We reserve the absolute right to suspend or lock user access terminals for tenant accounts showing payment failure, credential security leaks, or active violation of service limits.
                            </p>
                        </section>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
