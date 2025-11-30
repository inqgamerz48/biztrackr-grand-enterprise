import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PageTransitionProps {
    children: ReactNode;
}

const variants = {
    hidden: { opacity: 0, x: -20, y: 0 },
    enter: { opacity: 1, x: 0, y: 0 },
    exit: { opacity: 0, x: 0, y: -20 },
};

const PageTransition = ({ children }: PageTransitionProps) => {
    return (
        <motion.div
            initial="hidden"
            animate="enter"
            exit="exit"
            variants={variants}
            transition={{ type: 'linear', duration: 0.3 }}
        >
            {children}
        </motion.div>
    );
};

export default PageTransition;
