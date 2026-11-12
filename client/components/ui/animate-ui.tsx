import React from "react";
import { motion, HTMLMotionProps, AnimatePresence, Variants } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Animate UI - Motion Primitives for Sen Việt Luxury
 * Based on animate-ui.com specifications for shadcn/ui & Framer Motion
 * Delivers 60fps fluid luxury micro-interactions without changing component APIs
 */

export const luxuryEase = [0.16, 1, 0.3, 1] as const;

// 1. Animated Container with Staggered Children
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

export const itemFadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: luxuryEase,
    },
  },
};

// 2. Motion Card with Luxury Hover & Elevation
export interface MotionCardProps extends HTMLMotionProps<"div"> {
  className?: string;
  hoverEffect?: boolean;
}

export const MotionCard = React.forwardRef<HTMLDivElement, MotionCardProps>(
  ({ className, hoverEffect = true, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        variants={itemFadeUpVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        whileHover={
          hoverEffect
            ? {
                y: -5,
                boxShadow: "0 20px 35px -10px rgba(15, 41, 74, 0.12), 0 0 0 1px rgba(217, 119, 6, 0.25)",
                transition: { duration: 0.25, ease: luxuryEase },
              }
            : undefined
        }
        className={cn(
          "rounded-3xl border border-slate-100 bg-white transition-colors duration-300",
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
MotionCard.displayName = "MotionCard";

// 3. Tactile Motion Button (Spring feedback for CTA)
export interface MotionButtonProps extends HTMLMotionProps<"button"> {
  className?: string;
  variant?: "primary" | "gold" | "outline" | "ghost";
}

export const MotionButton = React.forwardRef<HTMLButtonElement, MotionButtonProps>(
  ({ className, variant = "primary", children, ...props }, ref) => {
    const variantStyles = {
      primary: "bg-primary text-white shadow-md hover:bg-primary/95",
      gold: "bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md shadow-amber-600/20 hover:from-amber-700 hover:to-amber-800",
      outline: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300",
      ghost: "text-slate-600 hover:bg-slate-100",
    }[variant];

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.15, ease: luxuryEase }}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
          variantStyles,
          className
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
MotionButton.displayName = "MotionButton";

// 4. Modal / Dialog Scale Transition
export const modalBackdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const modalContentVariants: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.3, ease: luxuryEase },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 8,
    transition: { duration: 0.18, ease: "easeIn" },
  },
};

export const chatWindowVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 24 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.28, ease: luxuryEase },
  },
  exit: {
    opacity: 0,
    scale: 0.94,
    y: 18,
    transition: { duration: 0.18, ease: "easeIn" },
  },
};

// 5. Staggered Container Helper
export const MotionStaggerList: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <motion.div
    variants={containerVariants}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-30px" }}
    className={className}
  >
    {children}
  </motion.div>
);

export { AnimatePresence, motion };
