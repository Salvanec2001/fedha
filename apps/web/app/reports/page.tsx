'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '../../components/NavBar';
import Footer from '../../components/Footer';
import { apiFetch, apiDownload, formatMoney, getToken } from '../../lib/api';

type Report = {
  currency: string;
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  savingsRate: number;
  categoryBreakdown: { name: string; total: number }[];
};

export default function ReportsPage() {
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [from, setFrom] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  function load() {
    apiFetch(`/reports/summary?from=${from}&to=${to}`).then(setReport).catch((err) => setError(err.message));
  }

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function download(format: 'pdf' | 'excel') {
    setDownloading(format);
    try {
      const ext = format === 'pdf' ? 'pdf' : 'xlsx';
      await apiDownload(`/reports/${format}?from=${from}&to=${to}`, `fedha-report.${ext}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDownloading(null);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full">
        <h1 className="text-2xl font-bold text-fedha-navy mb-6">Financial Report</h1>

        {error && <p className="text-fedha-red text-sm mb-4">{error}</p>}

        <div className="bg-white rounded-xl border p-4 shadow-sm mb-6 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-500">From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-500">To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
          </div>
          <button onClick={load} className="px-4 py-2 rounded-lg bg-fedha-navy text-white text-sm font-medium">
            Update
          </button>
          <div className="flex-1" />
          <button
            onClick={() => download('pdf')}
            disabled={downloading === 'pdf'}
            className="px-4 py-2 rounded-lg border border-fedha-navy text-fedha-navy text-sm font-medium disabled:opacity-50"
          >
            {downloading === 'pdf' ? 'Preparing…' : 'Download PDF'}
          </button>
          <button
            onClick={() => download('excel')}
            disabled={downloading === 'excel'}
            className="px-4 py-2 rounded-lg border border-fedha-navy text-fedha-navy text-sm font-medium disabled:opacity-50"
          >
            {downloading === 'excel' ? 'Preparing…' : 'Download Excel'}
          </button>
        </div>

        {report && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl border p-4 shadow-sm">
                <p className="text-xs text-gray-500">Total Balance</p>
                <p className="text-lg font-bold text-fedha-navy">{formatMoney(report.totalBalance, report.currency)}</p>
              </div>
              <div className="bg-white rounded-xl border p-4 shadow-sm">
                <p className="text-xs text-gray-500">Income</p>
                <p className="text-lg font-bold text-fedha-green">{formatMoney(report.totalIncome, report.currency)}</p>
              </div>
              <div className="bg-white rounded-xl border p-4 shadow-sm">
                <p className="text-xs text-gray-500">Expenses</p>
                <p className="text-lg font-bold text-fedha-red">{formatMoney(report.totalExpenses, report.currency)}</p>
              </div>
              <div className="bg-white rounded-xl border p-4 shadow-sm">
                <p className="text-xs text-gray-500">Net Cash Flow</p>
                <p className={`text-lg font-bold ${report.netCashFlow >= 0 ? 'text-fedha-green' : 'text-fedha-red'}`}>
                  {formatMoney(report.netCashFlow, report.currency)}
                </p>
              </div>
              <div className="bg-white rounded-xl border p-4 shadow-sm">
                <p className="text-xs text-gray-500">Savings Rate</p>
                <p className="text-lg font-bold text-fedha-navy">{report.savingsRate.toFixed(1)}%</p>
              </div>
            </div>

            <h2 className="text-lg font-semibold text-fedha-navy mb-3">Expenses by Category</h2>
            <div className="bg-white rounded-xl border shadow-sm divide-y">
              {report.categoryBreakdown.length === 0 && <p className="p-5 text-gray-500">No expenses in this period.</p>}
              {report.categoryBreakdown.map((c) => (
                <div key={c.name} className="p-4 flex justify-between items-center">
                  <p className="font-medium text-fedha-navy">{c.name}</p>
                  <p className="font-semibold text-fedha-red">{formatMoney(c.total, report.currency)}</p>
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
