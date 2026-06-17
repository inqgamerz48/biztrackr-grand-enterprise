import Link from 'next/link';
import Head from 'next/head';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-[#080808] text-[#F4F4F0] font-sans selection:bg-[#FF3300] selection:text-white relative">
            <Head>
                <title>Privacy Policy | BizTrackr PRO</title>
                <meta name="description" content="Legal and telemetry privacy policies for BizTrackr Pro." />
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
                            Effective Date: June 17, 2026
                        </span>
                        <h1 className="text-4xl md:text-6xl font-serif font-black tracking-tight text-white uppercase">
                            Privacy Policy
                        </h1>
                        <p className="text-gray-400 font-mono text-sm">
                            DOCUMENT REF: BIZ-SEC-PRIV-2026
                        </p>
                    </div>

                    <div className="space-y-8 font-sans text-gray-300 leading-relaxed text-sm md:text-base">
                        <section className="space-y-4">
                            <h2 className="text-xl md:text-2xl font-serif text-white uppercase tracking-tight">
                                1. Telemetry and Data Isolation
                            </h2>
                            <p>
                                BizTrackr PRO is engineered as a secure monolithic commerce operating system. When you provision an organization tenant, we collect credentials, auth telemetry, ledger activities, and inventory synchronization transactions. All database rows are strictly isolated via Supabase PostgreSQL Tenant Isolation rules.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl md:text-2xl font-serif text-white uppercase tracking-tight">
                                2. GDPR Compliance Rights
                            </h2>
                            <p>
                                Under the General Data Protection Regulation (GDPR), users residing within the EU/EEA possess the absolute right to:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 font-mono text-xs text-gray-400">
                                <li>Access and extract all database records linked to your tenant.</li>
                                <li>Rectify ledger records (subject to active double-entry accounting integrity).</li>
                                <li>Request absolute deletion ("Right to be Forgotten") of your organization.</li>
                                <li>Revoke cookie tracking telemetry preferences at any time.</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl md:text-2xl font-serif text-white uppercase tracking-tight">
                                3. Cookies and Persistent Indicators
                            </h2>
                            <p>
                                We utilize cookies solely to store authentication states (via Supabase Auth JWT) and user consent metrics (via localStorage). No third-party advertisements or trackers have access to our secure endpoint clusters.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl md:text-2xl font-serif text-white uppercase tracking-tight">
                                4. Third-Party Integrations
                            </h2>
                            <p>
                                Payment modules utilize secure gateway APIs (such as Razorpay). Credit card credentials and billing tokens never pass through or rest in the BizTrackr DB clusters. External integrations conform to PCI-DSS standards.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl md:text-2xl font-serif text-white uppercase tracking-tight">
                                5. Security & Audits
                            </h2>
                            <p>
                                All security events (such as failed authentication attempts or privilege changes) are written to our immutable database activity log. IP tracking is scoped purely to defend against volumetric attacks.
                            </p>
                        </section>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
