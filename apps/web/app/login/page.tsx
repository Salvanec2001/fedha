'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, setTokens } from '../../lib/api';
import { useLanguage } from '../../lib/i18n';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setTokens(res.accessToken, res.refreshToken);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-xl shadow-sm border p-8">
        <h1 className="text-2xl font-bold text-fedha-navy mb-6">{t('login')} to Fedha</h1>

        {error && <p className="mb-4 text-sm text-fedha-red">{error}</p>}

        <label className="block text-sm font-medium mb-1">{t('email')}</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-fedha-navy"
        />

        <label className="block text-sm font-medium mb-1">{t('password')}</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-2 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-fedha-navy"
        />
        <p className="text-right mb-4">
          <Link href="/forgot-password" className="text-xs text-fedha-navy hover:underline">
            {t('forgotPassword')}
          </Link>
        </p>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-fedha-navy text-white font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Logging in…' : t('login')}
        </button>

        <p className="text-sm text-gray-500 mt-4 text-center">
          No account? <Link href="/register" className="text-fedha-navy font-medium">{t('register')}</Link>
        </p>
      </form>
    </main>
  );
}
