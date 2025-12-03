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
        primary: "bg-primary text-primary-foreground hover:opacity-90 shadow-[0_0_15px_rgba(var(--primary),0.5)] border border-primary/30",
        secondary: "bg-secondary text-secondary-foreground hover:opacity-90 shadow-[0_0_15px_rgba(var(--secondary),0.3)] border border-secondary/30",
        danger: "bg-destructive text-destructive-foreground border border-destructive hover:bg-destructive/90 shadow-[0_0_15px_rgba(var(--destructive),0.5)]",
        ghost: "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border",
    };

    return (
        <motion.button
            whileHover={{
                scale: 1.05,
                boxShadow: "0 0 25px rgba(var(--primary),0.3)",
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
                className="absolute inset-0 bg-primary/20"
                initial={{ x: '-100%', skewX: -15 }}
                whileHover={{ x: '200%', transition: { duration: 0.6, ease: "easeInOut" } }}
            />

            <span className="relative z-10 flex items-center gap-2">
                {children}
            </span>
        </motion.button>
    );
};
