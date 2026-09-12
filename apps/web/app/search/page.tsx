'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import NavBar from '../../components/NavBar';
import Footer from '../../components/Footer';
import { apiFetch, formatMoney, getToken } from '../../lib/api';

type Results = {
  transactions: any[];
  accounts: any[];
  budgets: any[];
  goals: any[];
  debts: any[];
  receivables: any[];
};

export default function SearchPage() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Results | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!getToken()) router.push('/login');
  }, [router]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/search?q=${encodeURIComponent(q)}`);
      setResults(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const totalResults = results
    ? results.transactions.length + results.accounts.length + results.budgets.length + results.goals.length + results.debts.length + results.receivables.length
    : 0;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full">
        <h1 className="text-2xl font-bold text-fedha-navy mb-6">Search Fedha</h1>

        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <input
            autoFocus
            placeholder="Search transactions, accounts, budgets, goals, debts…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-fedha-navy"
          />
          <button type="submit" disabled={loading} className="px-5 py-3 rounded-lg bg-fedha-navy text-white font-semibold hover:opacity-90 disabled:opacity-50">
            {loading ? '…' : 'Search'}
          </button>
        </form>

        {error && <p className="text-fedha-red text-sm mb-4">{error}</p>}

        {results && (
          <>
            <p className="text-sm text-gray-500 mb-4">{totalResults} result(s) for "{q}"</p>

            {results.transactions.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">Transactions</h2>
                <div className="bg-white rounded-xl border shadow-sm divide-y">
                  {results.transactions.map((t: any) => (
                    <div key={t.id} className="p-3 flex justify-between text-sm">
                      <span>{t.description || t.category?.name || t.type} · {t.account.name}</span>
                      <span className="font-medium">{formatMoney(t.amount, t.currency)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.accounts.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">Accounts</h2>
                <div className="bg-white rounded-xl border shadow-sm divide-y">
                  {results.accounts.map((a: any) => (
                    <div key={a.id} className="p-3 text-sm">{a.name} · {formatMoney(a.currentBalance, a.currency)}</div>
                  ))}
                </div>
              </div>
            )}

            {results.budgets.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">Budgets</h2>
                <div className="bg-white rounded-xl border shadow-sm divide-y">
                  {results.budgets.map((b: any) => (
                    <div key={b.id} className="p-3 text-sm">{b.name} · {formatMoney(b.amount)}</div>
                  ))}
                </div>
              </div>
            )}

            {results.goals.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">Savings Goals</h2>
                <div className="bg-white rounded-xl border shadow-sm divide-y">
                  {results.goals.map((g: any) => (
                    <div key={g.id} className="p-3 text-sm">{g.name} · {formatMoney(g.targetAmount)}</div>
                  ))}
                </div>
              </div>
            )}

            {results.debts.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">Debts</h2>
                <div className="bg-white rounded-xl border shadow-sm divide-y">
                  {results.debts.map((d: any) => (
                    <div key={d.id} className="p-3 text-sm">{d.creditorName} · {formatMoney(d.remainingBalance)} remaining</div>
                  ))}
                </div>
              </div>
            )}

            {results.receivables.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">Receivables</h2>
                <div className="bg-white rounded-xl border shadow-sm divide-y">
                  {results.receivables.map((r: any) => (
                    <div key={r.id} className="p-3 text-sm">{r.debtorName} · {formatMoney(r.remainingBalance)} remaining</div>
                  ))}
                </div>
              </div>
            )}

            {totalResults === 0 && <p className="text-gray-500">No matches found.</p>}
          </>
        )}
      </div>
      <Footer />
    </main>
  );
}
