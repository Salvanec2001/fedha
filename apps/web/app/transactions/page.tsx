'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '../../components/NavBar';
import { apiFetch, formatMoney, getToken } from '../../lib/api';

type Account = { id: string; name: string; currency: string };
type Transaction = {
  id: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  amount: number;
  currency: string;
  occurredAt: string;
  description?: string;
  account: { name: string };
  toAccount?: { name: string } | null;
  category?: { name: string } | null;
};

export default function TransactionsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [type, setType] = useState<'INCOME' | 'EXPENSE' | 'TRANSFER'>('EXPENSE');
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    apiFetch('/accounts').then((accs) => {
      setAccounts(accs);
      if (accs.length && !accountId) setAccountId(accs[0].id);
    });
    apiFetch('/transactions').then(setTransactions).catch((err) => setError(err.message));
  }

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const majorUnits = parseFloat(amount || '0');
      await apiFetch('/transactions', {
        method: 'POST',
        body: JSON.stringify({
          type,
          accountId,
          toAccountId: type === 'TRANSFER' ? toAccountId : undefined,
          amount: Math.round(majorUnits * 100),
          occurredAt: new Date(occurredAt).toISOString(),
          description: description || undefined,
        }),
      });
      setAmount('');
      setDescription('');
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVoid(id: string) {
    await apiFetch(`/transactions/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-fedha-navy mb-6">Transactions</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 shadow-sm mb-8">
          <h2 className="font-semibold text-fedha-navy mb-4">Add a transaction</h2>
          {error && <p className="text-fedha-red text-sm mb-3">{error}</p>}

          <div className="flex gap-2 mb-4">
            {(['INCOME', 'EXPENSE', 'TRANSFER'] as const).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setType(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                  type === t ? 'bg-fedha-navy text-white border-fedha-navy' : 'text-gray-600'
                }`}
              >
                {t === 'INCOME' ? '+ Income' : t === 'EXPENSE' ? '− Expense' : '⇄ Transfer'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {type === 'TRANSFER' ? 'From account' : 'Account'}
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-fedha-navy"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            {type === 'TRANSFER' && (
              <div>
                <label className="block text-sm font-medium mb-1">To account</label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-fedha-navy"
                >
                  <option value="">Select…</option>
                  {accounts.filter((a) => a.id !== accountId).map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Amount (TZS)</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-fedha-navy"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-fedha-navy"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Description (optional)</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-fedha-navy"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !accountId}
            className="px-5 py-2.5 rounded-lg bg-fedha-navy text-white font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Save transaction'}
          </button>
        </form>

        <div className="bg-white rounded-xl border shadow-sm divide-y">
          {transactions.length === 0 && <p className="p-5 text-gray-500">No transactions yet.</p>}
          {transactions.map((t) => (
            <div key={t.id} className="p-4 flex justify-between items-center">
              <div>
                <p className="font-medium text-fedha-navy">
                  {t.description || t.category?.name || t.type}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(t.occurredAt).toLocaleDateString()} · {t.account.name}
                  {t.toAccount ? ` → ${t.toAccount.name}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p
                  className={`font-semibold ${
                    t.type === 'INCOME' ? 'text-fedha-green' : t.type === 'EXPENSE' ? 'text-fedha-red' : 'text-fedha-navy'
                  }`}
                >
                  {t.type === 'EXPENSE' ? '−' : t.type === 'INCOME' ? '+' : ''}
                  {formatMoney(t.amount, t.currency)}
                </p>
                <button onClick={() => handleVoid(t.id)} className="text-xs text-gray-400 hover:text-fedha-red">
                  Void
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
