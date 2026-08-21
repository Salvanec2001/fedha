'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NavBar from '../../components/NavBar';
import Footer from '../../components/Footer';
import { apiFetch, formatMoney, getToken } from '../../lib/api';

type Summary = {
  currency: string;
  totalBalance: number;
  incomeThisMonth: number;
  expensesThisMonth: number;
  netCashFlow: number;
  accounts: { id: string; name: string; type: string; currentBalance: number }[];
};

function Card({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' | 'neutral' }) {
  const color =
    tone === 'good' ? 'text-fedha-green' : tone === 'bad' ? 'text-fedha-red' : 'text-fedha-navy';
  return (
    <div className="bg-white rounded-xl border p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    apiFetch('/dashboard/summary')
      .then(setSummary)
      .catch((err) => setError(err.message));
  }, [router]);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar />
      <div className="max-w-5xl mx-auto px-6 py-8 flex-1 w-full">
        <h1 className="text-2xl font-bold text-fedha-navy mb-4">Your Financial Overview</h1>

        {error && <p className="text-fedha-red mb-4">{error}</p>}

        {!summary && !error && <p className="text-gray-500">Loading…</p>}

        {summary && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card label="Total Balance" value={formatMoney(summary.totalBalance, summary.currency)} />
              <Card
                label="Income This Month"
                value={formatMoney(summary.incomeThisMonth, summary.currency)}
                tone="good"
              />
              <Card
                label="Expenses This Month"
                value={formatMoney(summary.expensesThisMonth, summary.currency)}
                tone="bad"
              />
              <Card
                label="Net Cash Flow"
                value={formatMoney(summary.netCashFlow, summary.currency)}
                tone={summary.netCashFlow >= 0 ? 'good' : 'bad'}
              />
            </div>

            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-fedha-navy">Accounts</h2>
              <Link href="/reports" className="text-sm text-fedha-navy font-medium underline">
                View full report →
              </Link>
            </div>
            <div className="bg-white rounded-xl border shadow-sm divide-y">
              {summary.accounts.length === 0 && (
                <p className="p-5 text-gray-500">
                  No accounts yet. Add one on the Accounts page to get started.
                </p>
              )}
              {summary.accounts.map((a) => (
                <div key={a.id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-fedha-navy">{a.name}</p>
                    <p className="text-xs text-gray-400">{a.type.replace('_', ' ')}</p>
                  </div>
                  <p className="font-semibold">{formatMoney(a.currentBalance, summary.currency)}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <Footer />
    </main>
  );
}
