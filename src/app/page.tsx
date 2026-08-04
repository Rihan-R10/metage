'use client';

import { useEffect } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { ProviderHealthGrid } from '@/components/dashboard/ProviderHealthGrid';
import { UsageLogTable } from '@/components/dashboard/UsageLogTable';
import { useTokenStore } from '@/store/useTokenStore';

export default function Home() {
  const pollAllProviders = useTokenStore((state) => state.pollAllProviders);
  const masterPasscode = useTokenStore((state) => state.masterPasscode);

  useEffect(() => {
    if (masterPasscode) {
      void pollAllProviders();
    }
  }, [masterPasscode, pollAllProviders]);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      <DashboardHeader />

      <main className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        <KpiCards />
        <ProviderHealthGrid />
        <UsageLogTable />
      </main>
    </div>
  );
}
