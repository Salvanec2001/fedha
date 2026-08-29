'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '../../components/NavBar';
import Footer from '../../components/Footer';
import { apiFetch, formatMoney, getToken } from '../../lib/api';

type Account = { id: string; name: string };
type Recurring = {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  nextRunAt: string;
  endDate: string | null;
  isActive: boolean;
  account: { name: string };
};

export default function RecurringPage() {
  const router = useRouter();
  const [items, setItems] = useState<Recurring[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState('');
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [frequency, setFrequency] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState('');

  function load() {
    apiFetch('/recurring').then(setItems).catch((err) => setError(err.message));
    apiFetch('/accounts').then((accs) => {
      setAccounts(accs);
      if (accs.length && !accountId) setAccountId(accs[0].id);
    });
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
      await apiFetch('/recurring', {
        method: 'POST',
        body: JSON.stringify({
          name,
          type,
          amount: Math.round(parseFloat(amount || '0') * 100),
          accountId,
          frequency,
          startDate,
          endDate: endDate || undefined,
        }),
      });
      setName(''); setAmount(''); setEndDate('');
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggle(item: Recurring) {
    const path = item.isActive ? 'pause' : 'resume';
    await apiFetch(`/recurring/${item.id}/${path}`, { method: 'PATCH' });
    load();
  }

  async function skip(id: string) {
    await apiFetch(`/recurring/${id}/skip`, { method: 'POST' });
    load();
  }

  async function remove(id: string) {
    if (!confirm('Delete this recurring transaction? Past generated transactions stay in your history.')) return;
    await apiFetch(`/recurring/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full">
        <h1 className="text-2xl font-bold text-fedha-navy mb-2">Recurring Transactions</h1>
        <p className="text-sm text-gray-500 mb-6">
          Salary, rent, subscriptions — set them up once and Fedha records them automatically on schedule.
        </p>

        {error && <p className="text-fedha-red text-sm mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 shadow-sm mb-8">
          <h2 className="font-semibold text-fedha-navy mb-4">Set up a recurring transaction</h2>

          <div className="flex gap-2 mb-4">
            {(['INCOME', 'EXPENSE'] as const).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setType(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                  type === t ? 'bg-fedha-navy text-white border-fedha-navy' : 'text-gray-600'
                }`}
              >
                {t === 'INCOME' ? '+ Income' : '− Expense'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <input placeholder="e.g. Salary, Rent, Netflix" value={name} onChange={(e) => setName(e.target.value)} className="px-3 py-2 border rounded-lg" required />
            <input type="number" step="0.01" placeholder="Amount (TZS)" value={amount} onChange={(e) => setAmount(e.target.value)} className="px-3 py-2 border rounded-lg" required />
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="px-3 py-2 border rounded-lg">
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <select value={frequency} onChange={(e) => setFrequency(e.target.value as any)} className="px-3 py-2 border rounded-lg">
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </select>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Starts</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ends (optional)</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>

          <button type="submit" disabled={busy || !accountId} className="px-5 py-2.5 rounded-lg bg-fedha-navy text-white font-semibold hover:opacity-90 disabled:opacity-50">
            {busy ? 'Saving…' : '+ Add Recurring Transaction'}
          </button>
        </form>

        <div className="space-y-3">
          {items.length === 0 && <p className="text-gray-500">No recurring transactions yet.</p>}
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium text-fedha-navy">{item.name}</p>
                  <p className="text-xs text-gray-400">
                    {item.frequency.toLowerCase()} · {item.account.name} · next: {new Date(item.nextRunAt).toLocaleDateString()}
                    {!item.isActive && ' · paused'}
                  </p>
                </div>
                <p className={`font-semibold ${item.type === 'INCOME' ? 'text-fedha-green' : 'text-fedha-red'}`}>
                  {item.type === 'INCOME' ? '+' : '−'}{formatMoney(item.amount)}
                </p>
              </div>
              <div className="flex gap-3 mt-2">
                <button onClick={() => toggle(item)} className="text-xs text-gray-500 hover:text-fedha-navy font-medium">
                  {item.isActive ? 'Pause' : 'Resume'}
                </button>
                <button onClick={() => skip(item.id)} className="text-xs text-gray-500 hover:text-fedha-navy font-medium">Skip next</button>
                <button onClick={() => remove(item.id)} className="text-xs text-gray-400 hover:text-fedha-red font-medium">Remove</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </main>
  );
}
