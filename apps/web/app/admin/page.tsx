'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '../../components/NavBar';
import Footer from '../../components/Footer';
import { apiFetch, getToken } from '../../lib/api';

type Stats = {
  totalUsers: number;
  verifiedUsers: number;
  newToday: number;
  newThisWeek: number;
  newThisMonth: number;
  totalAccounts: number;
  totalTransactions: number;
  signupsByDay: Record<string, number>;
};

function Card({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white rounded-xl border p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold mt-1 text-fedha-navy">{value}</p>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) { router.push('/login'); return; }
    apiFetch('/admin/stats').then(setStats).catch((err) => setError(err.message));
  }, [router]);

  const days = stats ? Object.keys(stats.signupsByDay).sort() : [];
  const maxCount = stats ? Math.max(1, ...Object.values(stats.signupsByDay)) : 1;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full">
        <h1 className="text-2xl font-bold text-fedha-navy mb-2">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mb-6">Aggregated, anonymized platform stats — no individual financial data shown here.</p>

        {error && (
          <p className="text-fedha-red text-sm mb-4">
            {error.includes('Admin') ? 'This account is not the admin account.' : error}
          </p>
        )}

        {stats && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
              <Card label="Total Users" value={stats.totalUsers} />
              <Card label="Verified Users" value={stats.verifiedUsers} />
              <Card label="New Today" value={stats.newToday} />
              <Card label="New This Week" value={stats.newThisWeek} />
              <Card label="New This Month" value={stats.newThisMonth} />
              <Card label="Total Accounts" value={stats.totalAccounts} />
              <Card label="Total Transactions" value={stats.totalTransactions} />
            </div>

            <h2 className="text-lg font-semibold text-fedha-navy mb-3">Signups — last 30 days</h2>
            <div className="bg-white rounded-xl border shadow-sm p-4">
              {days.length === 0 && <p className="text-gray-500 text-sm">No signups in this period.</p>}
              <div className="flex items-end gap-1 h-32">
                {days.map((d) => (
                  <div key={d} className="flex-1 flex flex-col items-center justify-end h-full">
                    <div
                      className="w-full bg-fedha-gold rounded-t"
                      style={{ height: `${(stats.signupsByDay[d] / maxCount) * 100}%`, minHeight: 2 }}
                      title={`${d}: ${stats.signupsByDay[d]}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      <Footer />
    </main>
  );
}
