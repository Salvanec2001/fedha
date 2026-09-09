'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '../../lib/api';

function ResetPasswordInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!token) {
      setError('Reset link is missing its token.');
      return;
    }
    setLoading(true);
    try {
      await apiFetch('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) });
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border p-8">
        <h1 className="text-2xl font-bold text-fedha-navy mb-6">Choose a new password</h1>

        {error && <p className="mb-4 text-sm text-fedha-red">{error}</p>}

        {success ? (
          <p className="text-sm text-fedha-green">Password changed. Redirecting to log in…</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="block text-sm font-medium mb-1">New password</label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full mb-4 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-fedha-navy"
            />
            <label className="block text-sm font-medium mb-1">Confirm password</label>
            <input
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full mb-4 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-fedha-navy"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-fedha-navy text-white font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Reset password'}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}
