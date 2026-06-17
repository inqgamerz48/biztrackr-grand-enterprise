import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const DIAGNOSTICS = [
    'BOOTING COMMERCE OS OVERLAY...',
    'RESOLVING TENANT ROW ISOLATION MATRIX...',
    'ESTABLISHING SUPABASE DB CONNECTION...',
    'COMPILING SCHEMA TRANSACTIONS...',
    'VERIFYING CRYPTOGRAPHIC JWT TOKENS...',
    'INITIALIZING SYSTEM DEPLOYMENT...'
];

const ConsoleLoader = () => {
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        // Increment progress simulating diagnostic load
        const progressInterval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(progressInterval);
                    return 100;
                }
                return prev + Math.floor(Math.random() * 8) + 4;
            });
        }, 120);

        return () => clearInterval(progressInterval);
    }, []);

    useEffect(() => {
        // Stagger logs append based on current progress
        const logIndex = Math.min(
            Math.floor((progress / 100) * DIAGNOSTICS.length),
            DIAGNOSTICS.length - 1
        );
        
        if (DIAGNOSTICS[logIndex] && !logs.includes(DIAGNOSTICS[logIndex])) {
            setLogs((prev) => [...prev, DIAGNOSTICS[logIndex]]);
        }
    }, [progress, logs]);

    // Format progress bar using ASCII characters
    const getProgressBar = () => {
        const totalBlocks = 20;
        const filledBlocks = Math.min(Math.floor((progress / 100) * totalBlocks), totalBlocks);
        const emptyBlocks = totalBlocks - filledBlocks;
        return '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#080808] font-mono text-[#F4F4F0] p-6 selection:bg-[#FF3300] selection:text-white">
            {/* Blueprint Gridlines Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-20 pointer-events-none" />

            <div className="relative w-full max-w-xl border-2 border-[#FF3300] bg-[#1C1C1C] p-6 md:p-8 space-y-6 shadow-none rounded-none">
                {/* Header Tag */}
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                    <span className="text-xs font-bold text-[#FF3300]">
                        [ DIAGNOSTIC CORE BOOTLOADER ]
                    </span>
                    <span className="text-[10px] text-gray-500">
                        SYS_LEVEL_ACTIVE
                    </span>
                </div>

                {/* Progress bar and numeric percentage */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                        <span className="text-[#FF3300]">LOADING LEDGER MODULES</span>
                        <span>{Math.min(progress, 100)}%</span>
                    </div>
                    <div className="text-sm tracking-tighter text-[#FF3300] bg-[#080808] p-3 border border-white/5 font-mono select-none overflow-hidden whitespace-nowrap">
                        {getProgressBar()}
                    </div>
                </div>

                {/* Simulated Diagnostic Logs */}
                <div className="bg-[#080808] border border-white/5 p-4 h-40 overflow-y-auto space-y-2 text-[10px] leading-relaxed text-gray-400">
                    {logs.map((log, index) => (
                        <div key={index} className="flex gap-2 items-start">
                            <span className="text-[#FF3300] font-bold">»</span>
                            <span>{log}</span>
                        </div>
                    ))}
                    {progress < 100 && (
                        <motion.div
                            animate={{ opacity: [0, 1] }}
                            transition={{ repeat: Infinity, duration: 0.8 }}
                            className="inline-block w-1.5 h-3 bg-[#FF3300] ml-1"
                        />
                    )}
                </div>

                {/* Footer specs */}
                <div className="flex justify-between text-[9px] text-gray-500 border-t border-white/10 pt-4">
                    <span>SECURITY: TENANT_ISOLATION_ON</span>
                    <span>v1.4.0</span>
                </div>
            </div>
        </div>
    );
};

export default ConsoleLoader;
