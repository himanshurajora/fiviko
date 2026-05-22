import { motion, type HTMLMotionProps } from 'framer-motion';
import clsx from 'clsx';

interface CardProps extends HTMLMotionProps<'div'> {
  /** Apply a soft entrance animation when the card mounts. */
  animate?: boolean;
  padded?: boolean;
}

/** Rounded surface card — the base building block of the playful UI. */
export function Card({ animate = true, padded = true, className, children, ...props }: CardProps) {
  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 12 } : false}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={clsx('card', padded && 'p-5', className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
