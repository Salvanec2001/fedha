'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '../../lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border p-8">
        <h1 className="text-2xl font-bold text-fedha-navy mb-2">Reset your password</h1>
        <p className="text-sm text-gray-500 mb-6">Enter your email and we'll send you a reset link.</p>

        {error && <p className="mb-4 text-sm text-fedha-red">{error}</p>}

        {sent ? (
          <p className="text-sm text-fedha-green mb-4">
            If that email has a Fedha account, a reset link has been sent. Check your inbox.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mb-4 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-fedha-navy"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-fedha-navy text-white font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}

        <p className="text-sm text-gray-500 mt-4 text-center">
          <Link href="/login" className="text-fedha-navy font-medium">Back to log in</Link>
        </p>
      </div>
    </main>
  );
}
