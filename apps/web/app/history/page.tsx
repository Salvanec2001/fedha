'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '../../components/NavBar';
import Footer from '../../components/Footer';
import { apiFetch, getToken } from '../../lib/api';

type LogEntry = {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  createdAt: string;
};

const ACTION_LABELS: Record<string, string> = {
  'account.create': 'Account created',
  'account.update': 'Account updated',
  'account.delete': 'Account removed',
  'transaction.create': 'Transaction recorded',
  'transaction.void': 'Transaction voided',
  'budget.create': 'Budget created',
  'budget.update': 'Budget updated',
  'budget.delete': 'Budget deleted',
  'goal.create': 'Savings goal created',
  'goal.update': 'Savings goal updated',
  'goal.contribute': 'Contribution added to goal',
  'goal.delete': 'Savings goal deleted',
};

const ENTITY_FILTERS = [
  { value: '', label: 'All' },
  { value: 'account', label: 'Accounts' },
  { value: 'transaction', label: 'Transactions' },
  { value: 'budget', label: 'Budgets' },
  { value: 'savings_goal', label: 'Goals' },
];

function iconFor(entity: string) {
  switch (entity) {
    case 'account': return '🏦';
    case 'transaction': return '💸';
    case 'budget': return '📊';
    case 'savings_goal': return '🎯';
    default: return '•';
  }
}

export default function HistoryPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) { router.push('/login'); return; }
    apiFetch('/activity').then(setLogs).catch((err) => setError(err.message));
  }, [router]);

  const filtered = filter ? logs.filter((l) => l.entity === filter) : logs;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full">
        <h1 className="text-2xl font-bold text-fedha-navy mb-2">Activity History</h1>
        <p className="text-sm text-gray-500 mb-6">Every action Fedha has recorded for your account.</p>

        {error && <p className="text-fedha-red text-sm mb-4">{error}</p>}

        <div className="flex gap-2 mb-4 flex-wrap">
          {ENTITY_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                filter === f.value ? 'bg-fedha-navy text-white border-fedha-navy' : 'text-gray-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border shadow-sm divide-y">
          {filtered.length === 0 && <p className="p-5 text-gray-500">No activity recorded yet.</p>}
          {filtered.map((l) => (
            <div key={l.id} className="p-4 flex items-center gap-3">
              <span className="text-lg">{iconFor(l.entity)}</span>
              <div className="flex-1">
                <p className="font-medium text-fedha-navy text-sm">{ACTION_LABELS[l.action] ?? l.action}</p>
                <p className="text-xs text-gray-400">
                  {new Date(l.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </main>
  );
}
