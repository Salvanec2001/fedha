'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '../../components/NavBar';
import { apiFetch, formatMoney, getToken } from '../../lib/api';

type Account = {
  id: string;
  name: string;
  type: string;
  currency: string;
  currentBalance: number;
  institution?: string;
};

const ACCOUNT_TYPES = [
  { value: 'BANK', label: 'Bank' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
  { value: 'CASH', label: 'Cash' },
  { value: 'SAVINGS', label: 'Savings' },
  { value: 'INVESTMENT', label: 'Investment' },
  { value: 'BUSINESS', label: 'Business' },
];

export default function AccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [name, setName] = useState('');
  const [type, setType] = useState('BANK');
  const [institution, setInstitution] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    apiFetch('/accounts').then(setAccounts).catch((err) => setError(err.message));
  }

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    load();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const majorUnits = parseFloat(openingBalance || '0');
      await apiFetch('/accounts', {
        method: 'POST',
        body: JSON.stringify({
          name,
          type,
          institution: institution || undefined,
          openingBalance: Math.round(majorUnits * 100),
        }),
      });
      setName('');
      setInstitution('');
      setOpeningBalance('');
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-fedha-navy mb-6">Accounts</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 shadow-sm mb-8">
          <h2 className="font-semibold text-fedha-navy mb-4">Add an account</h2>
          {error && <p className="text-fedha-red text-sm mb-3">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                required
                placeholder="e.g. CRDB Current Account"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-fedha-navy"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-fedha-navy"
              >
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Institution / Provider (optional)</label>
              <input
                placeholder="e.g. M-Pesa, CRDB, NMB"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-fedha-navy"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Opening balance (TZS)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-fedha-navy"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 rounded-lg bg-fedha-navy text-white font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Adding…' : '+ Add Account'}
          </button>
        </form>

        <div className="bg-white rounded-xl border shadow-sm divide-y">
          {accounts.length === 0 && <p className="p-5 text-gray-500">No accounts yet.</p>}
          {accounts.map((a) => (
            <div key={a.id} className="p-4 flex justify-between items-center">
              <div>
                <p className="font-medium text-fedha-navy">{a.name}</p>
                <p className="text-xs text-gray-400">
                  {a.type.replace('_', ' ')}{a.institution ? ` · ${a.institution}` : ''}
                </p>
              </div>
              <p className="font-semibold">{formatMoney(a.currentBalance, a.currency)}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
