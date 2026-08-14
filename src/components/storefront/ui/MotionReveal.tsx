import { motion, useReducedMotion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '../../ui/utils';

interface MotionRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
  once?: boolean;
  amount?: number;
}

export function MotionReveal({
  children,
  className,
  delay = 0,
  duration = 0.6,
  direction = 'up',
  distance = 28,
  once = true,
  amount = 0.2
}: MotionRevealProps) {
  const reduceMotion = useReducedMotion();

  const offset = reduceMotion ? 0 : distance;

  const variants: Variants = {
    hidden: {
      opacity: 0,
      x: direction === 'left' ? offset : direction === 'right' ? -offset : 0,
      y: direction === 'up' ? offset : direction === 'down' ? -offset : 0
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration, delay, ease: [0.22, 1, 0.36, 1] }
    }
  };

  return (
    <motion.div
      className={cn(className)}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
    >
      {children}
    </motion.div>
  );
}
