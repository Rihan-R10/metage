'use client';

import { useEffect, useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { DollarSign, Flame, LineChart, Zap, Settings, CheckCircle2, AlertCircle } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { ProviderHealth } from '@/components/dashboard/ProviderHealth';
import { UsageTable } from '@/components/dashboard/UsageTable';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
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
  const { saveApiKeys, setMasterPasscode } = useTokenStore();
  
  const metrics = getMetricsSummary ? getMetricsSummary() : { todaySpend: 0, activeBurnRate: 0, projectedMonthlySpend: 0, totalTokens: 0 };

  const [isOpen, setIsOpen] = useState(false);
  const [openaiKey, setOpenaiKey] = useState('');
  const [passcode, setPasscode] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (masterPasscode && pollAllProviders) {
      void pollAllProviders();
    }
  }, [masterPasscode, pollAllProviders]);

  const handleSave = async () => {
    setFeedback(null);
    if (passcode) {
      setMasterPasscode(passcode);
    }
    
    const result = await saveApiKeys({ openai: openaiKey });
    
    if (result && !result.success) {
      setFeedback({ type: 'error', text: result.error || 'Invalid key format.' });
    } else {
      setFeedback({ type: 'success', text: 'Key validated successfully and encrypted with AES-256!' });
      setTimeout(() => {
        setIsOpen(false);
        setFeedback(null);
      }, 1800);
    }
  };

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
    <div className="min-h-screen bg-[#09090b] text-zinc-100 relative">
      <DashboardHeader />

      {/* Quick Configure Vault Button */}
      <div className="max-w-7xl mx-auto px-6 pt-4 flex justify-end">
        <button
          onClick={() => {
            setFeedback(null);
            setIsOpen(true);
          }}
          className="flex items-center gap-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          <Settings className="w-4 h-4" /> Configure Vault & Test Key
        </button>
      </div>

      <motion.main
        className="mx-auto max-w-7xl space-y-8 px-6 py-6"
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
          <DashboardCharts />
        </motion.div>

        <motion.div variants={sectionVariants}>
          <ProviderHealth />
        </motion.div>

        <motion.div variants={sectionVariants}>
          <UsageTable />
        </motion.div>
      </motion.main>

      {/* Settings Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h2 className="text-xl font-bold text-white">Secure Vault Setup & Validation</h2>
            
            {/* In-app Feedback Banner */}
            {feedback && (
              <div
                className={`p-3 rounded-lg text-sm flex items-start gap-2.5 border ${
                  feedback.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
                )}
                <span>{feedback.text}</span>
              </div>
            )}

            <div>
              <label className="block text-sm text-slate-400 mb-1">Master Passcode</label>
              <input
                type="password"
                placeholder="e.g., 12345"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">OpenAI API Key</label>
              <input
                type="text"
                placeholder="sk-..."
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                Try entering <code className="text-cyan-400">sk12343hh</code> to test validation error handling inside the UI.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 text-sm transition"
              >
                Save & Validate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}