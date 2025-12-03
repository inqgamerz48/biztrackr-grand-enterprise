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
        primary: "bg-white text-black hover:bg-gray-200 shadow-[0_0_15px_rgba(255,255,255,0.5)] border border-white/30",
        secondary: "bg-black text-white hover:bg-gray-900 shadow-[0_0_15px_rgba(255,255,255,0.3)] border border-white/30",
        danger: "bg-black text-white border border-white hover:bg-white hover:text-black shadow-[0_0_15px_rgba(255,255,255,0.5)]",
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
