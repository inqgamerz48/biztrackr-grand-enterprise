import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PageTransitionProps {
    children: ReactNode;
    className?: string;
}

const variants = {
    initial: {
        opacity: 0,
        x: -20,
        scale: 0.98,
        filter: 'blur(10px)',
    },
    enter: {
        opacity: 1,
        x: 0,
        scale: 1,
        filter: 'blur(0px)',
        transition: {
            duration: 0.4,
            ease: [0.43, 0.13, 0.23, 0.96], // Cinematic ease
            staggerChildren: 0.1,
        },
    },
    exit: {
        opacity: 0,
        x: 20,
        scale: 1.02,
        filter: 'blur(10px)',
        transition: {
            duration: 0.3,
            ease: 'easeInOut',
        },
    },
};

const slashVariants = {
    initial: {
        clipPath: 'polygon(0 0, 0 0, 0 100%, 0% 100%)',
    },
    enter: {
        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0% 100%)',
        transition: {
            duration: 0.5,
            ease: [0.43, 0.13, 0.23, 0.96],
        },
    },
    exit: {
        clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)',
        transition: {
            duration: 0.4,
            ease: 'easeInOut',
        },
    },
};

export const PageTransition = ({ children, className = '' }: PageTransitionProps) => {
    return (
        <motion.div
            initial="initial"
            animate="enter"
            exit="exit"
            variants={variants}
            className={`w-full h-full ${className}`}
        >
            {/* Optional: Add a "slash" overlay for extra flair if desired, 
          but for now we keep it clean with the motion blur slide */}
            {children}
        </motion.div>
    );
};
