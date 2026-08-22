'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: number;
  className?: string;
  priority?: boolean;
}

export function Logo({ size = 40, className, priority = true }: LogoProps) {
  return (
    <motion.div
      className={cn('relative flex items-center justify-center cursor-pointer select-none', className)}
      style={{ width: size, height: size }}
      initial="rest"
      whileHover="hover"
      animate="rest"
    >
      {/* Electric cyan blurred backdrop glow layer */}
      <motion.div
        className="absolute inset-0 rounded-xl bg-[#00F0FF] blur-md pointer-events-none"
        variants={{
          rest: { opacity: 0, scale: 1 },
          hover: { opacity: 0.6, scale: 1.3 },
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      />

      {/* Animated container with spring micro-rotation on hover */}
      <motion.div
        className="relative z-10 flex h-full w-full items-center justify-center overflow-hidden rounded-xl border border-cyan-500/30 bg-[#090a0f]"
        variants={{
          rest: { rotate: 0, scale: 1 },
          hover: { rotate: 6, scale: 1.08 },
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      >
        <Image
          src="/logo.png"
          alt="Metage Logo"
          width={size}
          height={size}
          priority={priority}
          className="h-full w-full object-cover"
        />
      </motion.div>
    </motion.div>
  );
}

export default Logo;
