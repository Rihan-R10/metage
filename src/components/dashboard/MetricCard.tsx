'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  accent: string;
  border: string;
  bg: string;
  index?: number;
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  accent,
  border,
  bg,
  index = 0,
}: MetricCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: 'easeOut' }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        'rounded-xl border border-slate-800 bg-slate-950/60 p-5',
        border
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-50">
            {value}
          </p>
        </div>
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800',
            bg
          )}
        >
          <Icon className={cn('h-5 w-5', accent)} />
        </div>
      </div>
    </motion.article>
  );
}
