'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '../../components/NavBar';
import Footer from '../../components/Footer';
import { apiFetch, formatMoney, getToken } from '../../lib/api';

type Goal = {
  id: string; name: string; targetAmount: number; currentAmount: number;
  progressPct: number; remaining: number; monthsToGoal: number | null; onTrack: boolean | null;
};

export default function GoalsPage() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [contributions, setContributions] = useState<Record<string, string>>({});

  function load() {
    apiFetch('/goals').then(setGoals).catch((err) => setError(err.message));
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
      await apiFetch('/goals', {
        method: 'POST',
        body: JSON.stringify({
          name,
          targetAmount: Math.round(parseFloat(targetAmount || '0') * 100),
          monthlyContribution: Math.round(parseFloat(monthlyContribution || '0') * 100),
          deadline: deadline || undefined,
        }),
      });
      setName(''); setTargetAmount(''); setMonthlyContribution(''); setDeadline('');
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function contribute(id: string) {
    const amount = Math.round(parseFloat(contributions[id] || '0') * 100);
    if (!amount) return;
    await apiFetch(`/goals/${id}/contribute`, { method: 'POST', body: JSON.stringify({ amount }) });
    setContributions({ ...contributions, [id]: '' });
    load();
  }

  async function remove(id: string) {
    await apiFetch(`/goals/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full">
        <h1 className="text-2xl font-bold text-fedha-navy mb-6">Savings Goals</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 shadow-sm mb-8">
          <h2 className="font-semibold text-fedha-navy mb-4">Create a goal</h2>
          {error && <p className="text-fedha-red text-sm mb-3">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <input placeholder="e.g. Emergency Fund" value={name} onChange={(e) => setName(e.target.value)} className="px-3 py-2 border rounded-lg" required />
            <input type="number" step="0.01" placeholder="Target amount (TZS)" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} className="px-3 py-2 border rounded-lg" required />
            <input type="number" step="0.01" placeholder="Monthly contribution (optional)" value={monthlyContribution} onChange={(e) => setMonthlyContribution(e.target.value)} className="px-3 py-2 border rounded-lg" />
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="px-3 py-2 border rounded-lg" />
          </div>
          <button type="submit" disabled={busy} className="px-5 py-2.5 rounded-lg bg-fedha-navy text-white font-semibold hover:opacity-90 disabled:opacity-50">
            {busy ? 'Saving…' : '+ Create Goal'}
          </button>
        </form>

        <div className="space-y-3">
          {goals.length === 0 && <p className="text-gray-500">No goals yet. Create one to start tracking progress.</p>}
          {goals.map((g) => (
            <div key={g.id} className="bg-white rounded-xl border p-4 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className="font-medium text-fedha-navy">{g.name}</p>
                  <p className="text-xs text-gray-400">
                    {formatMoney(g.currentAmount)} of {formatMoney(g.targetAmount)}
                    {g.monthsToGoal !== null && ` · ~${g.monthsToGoal} months to go`}
                    {g.onTrack === true && ' · On track'}
                    {g.onTrack === false && ' · Behind schedule'}
                  </p>
                </div>
                <button onClick={() => remove(g.id)} className="text-xs text-gray-400 hover:text-fedha-red">Remove</button>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                <div className="h-full bg-fedha-green" style={{ width: `${g.progressPct}%` }} />
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Add contribution"
                  value={contributions[g.id] ?? ''}
                  onChange={(e) => setContributions({ ...contributions, [g.id]: e.target.value })}
                  className="flex-1 px-3 py-1.5 border rounded-lg text-sm"
                />
                <button onClick={() => contribute(g.id)} className="px-3 py-1.5 rounded-lg bg-fedha-navy text-white text-sm font-medium">
                  Add
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </main>
  );
}
