import React, { useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * BlurText - Editorial Word Reveal with Blur Effect
 * Inspired by React Bits (reactbits.dev) & Impeccable Typography
 * Renders words with staggered blur -> sharp text transition
 */
export interface BlurTextProps {
  text: string;
  className?: string;
  delay?: number;
  wordClassName?: string;
}

export function BlurText({ text, className, delay = 0.04, wordClassName }: BlurTextProps) {
  const words = text.split(" ");
  const ref = React.useRef<HTMLHeadingElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <h1 ref={ref} className={cn("inline-flex flex-wrap gap-x-3 gap-y-1", className)}>
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          initial={{ opacity: 0, filter: "blur(12px)", y: 16 }}
          animate={isInView ? { opacity: 1, filter: "blur(0px)", y: 0 } : {}}
          transition={{
            duration: 0.55,
            delay: index * delay,
            ease: [0.16, 1, 0.3, 1],
          }}
          className={cn("inline-block will-change-[transform,filter,opacity]", wordClassName)}
        >
          {word}
        </motion.span>
      ))}
    </h1>
  );
}

/**
 * ShinyBadge - Shimmering Metallic Badge
 * Inspired by React Bits (reactbits.dev)
 * Adds an exquisite luxury gold reflection that sweeps across the badge
 */
export interface ShinyBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function ShinyBadge({ children, className, ...props }: ShinyBadgeProps) {
  return (
    <div
      className={cn(
        "relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-amber-500/30 bg-primary/40 px-4 py-2 text-xs font-semibold uppercase tracking-[.15em] text-amber-300 backdrop-blur-md shadow-xs",
        className
      )}
      {...props}
    >
      {/* Animated Light Shimmer Beam */}
      <motion.div
        aria-hidden="true"
        animate={{
          x: ["-100%", "250%"],
        }}
        transition={{
          repeat: Infinity,
          duration: 3.5,
          ease: "easeInOut",
          repeatDelay: 2,
        }}
        className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-amber-200/25 to-transparent w-1/2"
      />
      <div className="relative z-10 flex items-center gap-2">{children}</div>
    </div>
  );
}

/**
 * CountUp - Smooth Animated Number Counter
 * Counts smoothly from 0 to target value on scroll into view
 */
export interface CountUpProps {
  end: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  className?: string;
}

export function CountUp({
  end,
  duration = 1.4,
  suffix = "",
  prefix = "",
  decimals = 0,
  className,
}: CountUpProps) {
  const [value, setValue] = useState(0);
  const ref = React.useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number | null = null;
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      // Ease out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = easedProgress * end;

      setValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setValue(end);
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isInView, end, duration]);

  const display =
    prefix +
    (decimals > 0
      ? value.toFixed(decimals)
      : Math.floor(value).toString().padStart(end < 10 && end > 0 ? 2 : 1, "0")) +
    suffix;

  return (
    <span ref={ref} className={cn("tabular-nums font-display font-bold", className)}>
      {display}
    </span>
  );
}
