import React, { useRef, useState, useCallback } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

export interface SpotlightCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  enableTilt?: boolean;
}

/**
 * SpotlightCard & 3D Tilt Component
 * Inspired by React Bits (reactbits.dev) & Impeccable Style
 * Creates an ultra-refined radial gold illumination that follows cursor
 * with gentle 3D perspective tilt for a true 5-star luxury experience.
 */
export const SpotlightCard = React.forwardRef<HTMLDivElement, SpotlightCardProps>(
  (
    {
      children,
      className,
      spotlightColor = "rgba(217, 119, 6, 0.14)", // Lotus Gold sheen
      enableTilt = true,
      ...props
    },
    forwardedRef
  ) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const cardRef = (forwardedRef as React.RefObject<HTMLDivElement>) || internalRef;

    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);
    const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });

    const handleMouseMove = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setMousePos({ x, y });

        if (enableTilt) {
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          // Subtle tilt: max 5-7 degrees for luxury restraint
          const rotateX = ((y - centerY) / centerY) * -5;
          const rotateY = ((x - centerX) / centerX) * 5;
          setTilt({ rotateX, rotateY });
        }
      },
      [cardRef, enableTilt]
    );

    const handleMouseEnter = useCallback(() => {
      setIsHovered(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
      setIsHovered(false);
      setTilt({ rotateX: 0, rotateY: 0 });
    }, []);

    return (
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        animate={{
          rotateX: isHovered ? tilt.rotateX : 0,
          rotateY: isHovered ? tilt.rotateY : 0,
          y: isHovered ? -5 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 24,
          mass: 0.8,
        }}
        style={{
          transformStyle: "preserve-3d",
          perspective: 1000,
        }}
        className={cn(
          "group relative overflow-hidden rounded-2xl border border-border/80 bg-card transition-colors duration-300",
          className
        )}
        {...props}
      >
        {/* Radial Spotlight Overlay following cursor */}
        <div
          className="pointer-events-none absolute -inset-px transition-opacity duration-500 ease-out z-10"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(450px circle at ${mousePos.x}px ${mousePos.y}px, ${spotlightColor}, transparent 70%)`,
          }}
        />

        {/* Subtle border highlight following spotlight */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-500 z-10"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(280px circle at ${mousePos.x}px ${mousePos.y}px, rgba(217, 119, 6, 0.3), transparent 80%)`,
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            padding: "1px",
          }}
        />

        {/* Card Content */}
        <div className="relative z-0 h-full w-full">{children}</div>
      </motion.div>
    );
  }
);

SpotlightCard.displayName = "SpotlightCard";
