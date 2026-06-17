import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Check, X, Settings } from 'lucide-react';

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [preferences, setPreferences] = useState({
        essential: true,
        analytics: true,
        marketing: false
    });

    useEffect(() => {
        const consent = localStorage.getItem('user-cookie-consent');
        if (!consent) {
            // Delay appearance for organic feel
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAcceptAll = () => {
        localStorage.setItem('user-cookie-consent', JSON.stringify({
            accepted: 'all',
            preferences: { essential: true, analytics: true, marketing: true },
            timestamp: new Date().toISOString()
        }));
        setIsVisible(false);
    };

    const handleDeclineAll = () => {
        localStorage.setItem('user-cookie-consent', JSON.stringify({
            accepted: 'none',
            preferences: { essential: true, analytics: false, marketing: false },
            timestamp: new Date().toISOString()
        }));
        setIsVisible(false);
    };

    const handleSavePreferences = () => {
        localStorage.setItem('user-cookie-consent', JSON.stringify({
            accepted: 'custom',
            preferences,
            timestamp: new Date().toISOString()
        }));
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="fixed bottom-0 left-0 right-0 z-50 p-6 md:p-8 bg-[#080808] border-t-2 border-[#FF3300] font-mono text-[#F4F4F0]"
                >
                    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                        <div className="space-y-2 max-w-3xl">
                            <div className="flex items-center gap-3">
                                <span className="p-1.5 bg-[#FF3300]/15 border border-[#FF3300]/40 text-[#FF3300]">
                                    <ShieldAlert className="w-5 h-5" />
                                </span>
                                <h4 className="text-sm tracking-wider uppercase font-bold text-white">
                                    [ cookie compliance scanner v1.0 ]
                                </h4>
                            </div>
                            <p className="text-xs text-gray-400 leading-relaxed font-sans">
                                We utilize performance telemetry and security cookie tracking to isolate tenant memory and run latency regressions. Under GDPR, you have the absolute fucking right to choose which metrics we log.
                            </p>
                        </div>

                        {!showSettings ? (
                            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                                <button
                                    onClick={() => setShowSettings(true)}
                                    className="flex items-center gap-2 px-4 py-2.5 text-xs border border-white/10 hover:border-[#FF3300]/50 hover:text-white transition-colors uppercase cursor-pointer"
                                >
                                    <Settings className="w-3.5 h-3.5" /> Configure
                                </button>
                                <button
                                    onClick={handleDeclineAll}
                                    className="px-4 py-2.5 text-xs border border-white/10 hover:border-white/30 text-gray-400 hover:text-white transition-colors uppercase cursor-pointer"
                                >
                                    Decline All
                                </button>
                                <button
                                    onClick={handleAcceptAll}
                                    className="px-6 py-2.5 text-xs bg-[#FF3300] text-white font-bold hover:bg-[#E02D00] transition-colors uppercase flex items-center gap-2 cursor-pointer"
                                >
                                    <Check className="w-3.5 h-3.5" /> Accept All
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-6 w-full lg:w-auto bg-[#1C1C1C] p-4 border border-white/5">
                                <div className="flex flex-col sm:flex-row gap-4">
                                    {/* Essential */}
                                    <label className="flex items-center gap-2 cursor-not-allowed opacity-60">
                                        <input
                                            type="checkbox"
                                            checked={true}
                                            disabled={true}
                                            className="accent-[#FF3300]"
                                        />
                                        <span className="text-[10px] uppercase font-bold tracking-wider">
                                            Essential (Always On)
                                        </span>
                                    </label>
                                    
                                    {/* Analytics */}
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={preferences.analytics}
                                            onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                                            className="accent-[#FF3300]"
                                        />
                                        <span className="text-[10px] uppercase font-bold tracking-wider text-gray-300">
                                            Analytics
                                        </span>
                                    </label>

                                    {/* Marketing */}
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={preferences.marketing}
                                            onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                                            className="accent-[#FF3300]"
                                        />
                                        <span className="text-[10px] uppercase font-bold tracking-wider text-gray-300">
                                            Marketing
                                        </span>
                                    </label>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowSettings(false)}
                                        className="p-2 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white transition-colors cursor-pointer"
                                        title="Cancel"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={handleSavePreferences}
                                        className="px-4 py-2 text-xs bg-[#FF3300] text-white hover:bg-[#E02D00] transition-colors uppercase font-bold cursor-pointer"
                                    >
                                        Save Choice
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
