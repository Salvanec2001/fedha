'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '../../components/NavBar';
import Footer from '../../components/Footer';
import { apiFetch, formatMoney, getToken } from '../../lib/api';

type Budget = { id: string; name: string; amount: number; spent: number; remaining: number; percentUsed: number; period: string };

export default function BudgetsPage() {
  const router = useRouter();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState('MONTHLY');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function load() {
    apiFetch('/budgets').then(setBudgets).catch((err) => setError(err.message));
  }

  useEffect(() => {
    if (!getToken()) { router.push('/login'); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await apiFetch('/budgets', {
        method: 'POST',
        body: JSON.stringify({ name, amount: Math.round(parseFloat(amount || '0') * 100), period }),
      });
      setName('');
      setAmount('');
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    await apiFetch(`/budgets/${id}`, { method: 'DELETE' });
    load();
  }

  function barColor(pct: number) {
    if (pct >= 100) return 'bg-fedha-red';
    if (pct >= 70) return 'bg-fedha-amber';
    return 'bg-fedha-green';
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full">
        <h1 className="text-2xl font-bold text-fedha-navy mb-6">Budgets</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 shadow-sm mb-8">
          <h2 className="font-semibold text-fedha-navy mb-4">Create a budget</h2>
          {error && <p className="text-fedha-red text-sm mb-3">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <input placeholder="e.g. Food" value={name} onChange={(e) => setName(e.target.value)} className="px-3 py-2 border rounded-lg" required />
            <input type="number" step="0.01" placeholder="Amount (TZS)" value={amount} onChange={(e) => setAmount(e.target.value)} className="px-3 py-2 border rounded-lg" required />
            <select value={period} onChange={(e) => setPeriod(e.target.value)} className="px-3 py-2 border rounded-lg">
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="ANNUAL">Annual</option>
            </select>
          </div>
          <button type="submit" disabled={busy} className="px-5 py-2.5 rounded-lg bg-fedha-navy text-white font-semibold hover:opacity-90 disabled:opacity-50">
            {busy ? 'Saving…' : '+ Create Budget'}
          </button>
        </form>

        <div className="space-y-3">
          {budgets.length === 0 && <p className="text-gray-500">No budgets yet. Create your first budget to start controlling your spending.</p>}
          {budgets.map((b) => (
            <div key={b.id} className="bg-white rounded-xl border p-4 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className="font-medium text-fedha-navy">{b.name}</p>
                  <p className="text-xs text-gray-400">{b.period}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatMoney(b.spent)} / {formatMoney(b.amount)}</p>
                  <button onClick={() => remove(b.id)} className="text-xs text-gray-400 hover:text-fedha-red">Remove</button>
                </div>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${barColor(b.percentUsed)}`} style={{ width: `${Math.min(100, b.percentUsed)}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-1">{b.percentUsed}% used · {formatMoney(b.remaining)} remaining</p>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </main>
  );
}
