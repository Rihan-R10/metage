'use client';

import { useEffect } from 'react';
import { motion, type Variants } from 'framer-motion';
import { DollarSign, Flame, LineChart, Zap } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { ProviderHealth } from '@/components/dashboard/ProviderHealth';
import { UsageTable } from '@/components/dashboard/UsageTable';
import { useTokenStore } from '@/store/useTokenStore';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

function formatTokens(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export default function Home() {
  const pollAllProviders = useTokenStore((state) => state.pollAllProviders);
  const masterPasscode = useTokenStore((state) => state.masterPasscode);
  const getMetricsSummary = useTokenStore((state) => state.getMetricsSummary);
  const metrics = getMetricsSummary();

  useEffect(() => {
    if (masterPasscode) {
      void pollAllProviders();
    }
  }, [masterPasscode, pollAllProviders]);

  const metricCards = [
    {
      label: "Today's Spend",
      value: formatCurrency(metrics.todaySpend),
      icon: DollarSign,
      accent: 'text-emerald-400',
      border: 'border-emerald-500/20',
      bg: 'bg-emerald-500/5',
    },
    {
      label: 'Active Burn Rate',
      value: `${formatCurrency(metrics.activeBurnRate)}/hr`,
      icon: Flame,
      accent: 'text-amber-400',
      border: 'border-amber-500/20',
      bg: 'bg-amber-500/5',
    },
    {
      label: 'Projected Monthly',
      value: formatCurrency(metrics.projectedMonthlySpend),
      icon: LineChart,
      accent: 'text-sky-400',
      border: 'border-sky-500/20',
      bg: 'bg-sky-500/5',
    },
    {
      label: 'Total Tokens',
      value: formatTokens(metrics.totalTokens),
      icon: Zap,
      accent: 'text-violet-400',
      border: 'border-violet-500/20',
      bg: 'bg-violet-500/5',
    },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      <DashboardHeader />

      <motion.main
        className="mx-auto max-w-7xl space-y-8 px-6 py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.section
          variants={sectionVariants}
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {metricCards.map((card, index) => (
            <MetricCard key={card.label} {...card} index={index} />
          ))}
        </motion.section>

        <motion.div variants={sectionVariants}>
          <ProviderHealth />
        </motion.div>

        <motion.div variants={sectionVariants}>
          <UsageTable />
        </motion.div>
      </motion.main>
    </div>
  );
}
