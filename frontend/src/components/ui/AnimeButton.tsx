import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '../../lib/utils'; // Assuming a utils file exists for class merging, otherwise I'll use template literals

interface AnimeButtonProps extends HTMLMotionProps<"button"> {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    className?: string;
}

export const AnimeButton = ({ children, variant = 'primary', className = '', ...props }: AnimeButtonProps) => {
    const baseStyles = "relative overflow-hidden px-6 py-3 rounded-md font-bold uppercase tracking-wider transition-all duration-200";

    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.5)] border border-blue-400/30",
        secondary: "bg-purple-600 text-white hover:bg-purple-500 shadow-[0_0_15px_rgba(147,51,234,0.5)] border border-purple-400/30",
        danger: "bg-red-600 text-white hover:bg-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)] border border-red-400/30",
        ghost: "bg-transparent text-gray-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/20",
    };

    return (
        <motion.button
            whileHover={{
                scale: 1.05,
                boxShadow: "0 0 25px rgba(255,255,255,0.3)",
            }}
            whileTap={{
                scale: 0.95,
                rotate: [0, -1, 1, -1, 0], // Subtle shake on impact
                transition: { duration: 0.2 }
            }}
            className={`${baseStyles} ${variants[variant]} ${className} `}
            {...props}
        >
            {/* Energy overlay effect */}
            <motion.div
                className="absolute inset-0 bg-white/20"
                initial={{ x: '-100%', skewX: -15 }}
                whileHover={{ x: '200%', transition: { duration: 0.6, ease: "easeInOut" } }}
            />

            <span className="relative z-10 flex items-center gap-2">
                {children}
            </span>
        </motion.button>
    );
};
