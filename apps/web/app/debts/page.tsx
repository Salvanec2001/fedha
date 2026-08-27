'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '../../components/NavBar';
import Footer from '../../components/Footer';
import { apiFetch, formatMoney, getToken } from '../../lib/api';

type Debt = {
  id: string;
  creditorName: string;
  principal: number;
  remainingBalance: number;
  dueDate: string | null;
  status: 'ACTIVE' | 'PAID' | 'OVERDUE';
  payments: { id: string; amount: number; paidAt: string }[];
};

type Receivable = {
  id: string;
  debtorName: string;
  amount: number;
  remainingBalance: number;
  expectedRepaymentDate: string | null;
  status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
  payments: { id: string; amount: number; paidAt: string }[];
};

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'text-fedha-navy',
  PENDING: 'text-fedha-navy',
  PARTIALLY_PAID: 'text-fedha-amber',
  PAID: 'text-fedha-green',
  OVERDUE: 'text-fedha-red',
};

export default function DebtsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'owe' | 'owed'>('owe');
  const [debts, setDebts] = useState<Debt[]>([]);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [payments, setPayments] = useState<Record<string, string>>({});

  const [creditorName, setCreditorName] = useState('');
  const [principal, setPrincipal] = useState('');
  const [dueDate, setDueDate] = useState('');

  const [debtorName, setDebtorName] = useState('');
  const [amount, setAmount] = useState('');
  const [expectedRepaymentDate, setExpectedRepaymentDate] = useState('');

  function load() {
    apiFetch('/debts').then(setDebts).catch((err) => setError(err.message));
    apiFetch('/receivables').then(setReceivables).catch((err) => setError(err.message));
  }

  useEffect(() => {
    if (!getToken()) { router.push('/login'); return; }
    load();
  }, [router]);

  async function addDebt(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await apiFetch('/debts', {
        method: 'POST',
        body: JSON.stringify({
          creditorName,
          principal: Math.round(parseFloat(principal || '0') * 100),
          dueDate: dueDate || undefined,
        }),
      });
      setCreditorName(''); setPrincipal(''); setDueDate('');
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function addReceivable(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await apiFetch('/receivables', {
        method: 'POST',
        body: JSON.stringify({
          debtorName,
          amount: Math.round(parseFloat(amount || '0') * 100),
          expectedRepaymentDate: expectedRepaymentDate || undefined,
        }),
      });
      setDebtorName(''); setAmount(''); setExpectedRepaymentDate('');
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function payDebt(id: string) {
    const value = Math.round(parseFloat(payments[id] || '0') * 100);
    if (!value) return;
    try {
      await apiFetch(`/debts/${id}/payments`, { method: 'POST', body: JSON.stringify({ amount: value }) });
      setPayments({ ...payments, [id]: '' });
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function payReceivable(id: string) {
    const value = Math.round(parseFloat(payments[id] || '0') * 100);
    if (!value) return;
    try {
      await apiFetch(`/receivables/${id}/payments`, { method: 'POST', body: JSON.stringify({ amount: value }) });
      setPayments({ ...payments, [id]: '' });
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function removeDebt(id: string) {
    if (!confirm('Delete this debt record?')) return;
    await apiFetch(`/debts/${id}`, { method: 'DELETE' });
    load();
  }

  async function removeReceivable(id: string) {
    if (!confirm('Delete this receivable record?')) return;
    await apiFetch(`/receivables/${id}`, { method: 'DELETE' });
    load();
  }

  const totalOwed = debts.reduce((s, d) => s + d.remainingBalance, 0);
  const totalOwedToMe = receivables.reduce((s, r) => s + r.remainingBalance, 0);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full">
        <h1 className="text-2xl font-bold text-fedha-navy mb-6">Debts &amp; Receivables</h1>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl border p-4 shadow-sm">
            <p className="text-xs text-gray-500">You owe</p>
            <p className="text-lg font-bold text-fedha-red">{formatMoney(totalOwed)}</p>
          </div>
          <div className="bg-white rounded-xl border p-4 shadow-sm">
            <p className="text-xs text-gray-500">Owed to you</p>
            <p className="text-lg font-bold text-fedha-green">{formatMoney(totalOwedToMe)}</p>
          </div>
        </div>

        {error && <p className="text-fedha-red text-sm mb-4">{error}</p>}

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('owe')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border ${tab === 'owe' ? 'bg-fedha-navy text-white border-fedha-navy' : 'text-gray-600'}`}
          >
            I Owe
          </button>
          <button
            onClick={() => setTab('owed')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border ${tab === 'owed' ? 'bg-fedha-navy text-white border-fedha-navy' : 'text-gray-600'}`}
          >
            Owed to Me
          </button>
        </div>

        {tab === 'owe' && (
          <>
            <form onSubmit={addDebt} className="bg-white rounded-xl border p-6 shadow-sm mb-8">
              <h2 className="font-semibold text-fedha-navy mb-4">Record a debt</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <input placeholder="Who you owe" value={creditorName} onChange={(e) => setCreditorName(e.target.value)} className="px-3 py-2 border rounded-lg" required />
                <input type="number" step="0.01" placeholder="Amount (TZS)" value={principal} onChange={(e) => setPrincipal(e.target.value)} className="px-3 py-2 border rounded-lg" required />
                <input type="date" placeholder="Due date (optional)" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="px-3 py-2 border rounded-lg" />
              </div>
              <button type="submit" disabled={busy} className="px-5 py-2.5 rounded-lg bg-fedha-navy text-white font-semibold hover:opacity-90 disabled:opacity-50">
                {busy ? 'Saving…' : '+ Record Debt'}
              </button>
            </form>

            <div className="space-y-3">
              {debts.length === 0 && <p className="text-gray-500">No debts recorded.</p>}
              {debts.map((d) => (
                <div key={d.id} className="bg-white rounded-xl border p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-fedha-navy">{d.creditorName}</p>
                      <p className={`text-xs font-medium ${STATUS_COLOR[d.status]}`}>{d.status}{d.dueDate ? ` · due ${new Date(d.dueDate).toLocaleDateString()}` : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-fedha-red">{formatMoney(d.remainingBalance)}</p>
                      <p className="text-xs text-gray-400">of {formatMoney(d.principal)}</p>
                    </div>
                  </div>
                  {d.status !== 'PAID' && (
                    <div className="flex gap-2 mt-2">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Payment amount"
                        value={payments[d.id] ?? ''}
                        onChange={(e) => setPayments({ ...payments, [d.id]: e.target.value })}
                        className="flex-1 px-3 py-1.5 border rounded-lg text-sm"
                      />
                      <button onClick={() => payDebt(d.id)} className="px-3 py-1.5 rounded-lg bg-fedha-navy text-white text-sm font-medium">Pay</button>
                    </div>
                  )}
                  <button onClick={() => removeDebt(d.id)} className="text-xs text-gray-400 hover:text-fedha-red mt-2">Remove</button>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'owed' && (
          <>
            <form onSubmit={addReceivable} className="bg-white rounded-xl border p-6 shadow-sm mb-8">
              <h2 className="font-semibold text-fedha-navy mb-4">Record money owed to you</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <input placeholder="Who owes you" value={debtorName} onChange={(e) => setDebtorName(e.target.value)} className="px-3 py-2 border rounded-lg" required />
                <input type="number" step="0.01" placeholder="Amount (TZS)" value={amount} onChange={(e) => setAmount(e.target.value)} className="px-3 py-2 border rounded-lg" required />
                <input type="date" placeholder="Expected repayment (optional)" value={expectedRepaymentDate} onChange={(e) => setExpectedRepaymentDate(e.target.value)} className="px-3 py-2 border rounded-lg" />
              </div>
              <button type="submit" disabled={busy} className="px-5 py-2.5 rounded-lg bg-fedha-navy text-white font-semibold hover:opacity-90 disabled:opacity-50">
                {busy ? 'Saving…' : '+ Record Receivable'}
              </button>
            </form>

            <div className="space-y-3">
              {receivables.length === 0 && <p className="text-gray-500">No receivables recorded.</p>}
              {receivables.map((r) => (
                <div key={r.id} className="bg-white rounded-xl border p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-fedha-navy">{r.debtorName}</p>
                      <p className={`text-xs font-medium ${STATUS_COLOR[r.status]}`}>{r.status.replace('_', ' ')}{r.expectedRepaymentDate ? ` · expected ${new Date(r.expectedRepaymentDate).toLocaleDateString()}` : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-fedha-green">{formatMoney(r.remainingBalance)}</p>
                      <p className="text-xs text-gray-400">of {formatMoney(r.amount)}</p>
                    </div>
                  </div>
                  {r.status !== 'PAID' && (
                    <div className="flex gap-2 mt-2">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Payment received"
                        value={payments[r.id] ?? ''}
                        onChange={(e) => setPayments({ ...payments, [r.id]: e.target.value })}
                        className="flex-1 px-3 py-1.5 border rounded-lg text-sm"
                      />
                      <button onClick={() => payReceivable(r.id)} className="px-3 py-1.5 rounded-lg bg-fedha-navy text-white text-sm font-medium">Record</button>
                    </div>
                  )}
                  <button onClick={() => removeReceivable(r.id)} className="text-xs text-gray-400 hover:text-fedha-red mt-2">Remove</button>
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
