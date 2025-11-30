import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface StaggeredListProps {
    children: ReactNode[];
    className?: string;
    staggerDuration?: number;
}

const containerVariants = {
    hidden: { opacity: 0 },
    show: (staggerDuration: number) => ({
        opacity: 1,
        transition: {
            staggerChildren: staggerDuration,
        },
    }),
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

export const StaggeredList = ({ children, className = '', staggerDuration = 0.1 }: StaggeredListProps) => {
    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            custom={staggerDuration}
            className={className}
        >
            {children.map((child, index) => (
                <motion.div key={index} variants={itemVariants}>
                    {child}
                </motion.div>
            ))}
        </motion.div>
    );
};
