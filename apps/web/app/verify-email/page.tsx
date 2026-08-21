'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '../../lib/api';

function VerifyEmailInner() {
  const params = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token was provided.');
      return;
    }
    apiFetch('/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) })
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error');
        setMessage(err.message);
      });
  }, [token]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl border shadow-sm p-8 max-w-sm text-center">
        {status === 'checking' && <p className="text-gray-500">Verifying your email…</p>}
        {status === 'success' && (
          <>
            <h1 className="text-xl font-bold text-fedha-navy mb-2">Email verified</h1>
            <p className="text-gray-500 mb-6">Your Fedha account email is now confirmed.</p>
          </>
        )}
        {status === 'error' && (
          <>
            <h1 className="text-xl font-bold text-fedha-red mb-2">Verification failed</h1>
            <p className="text-gray-500 mb-6">{message}</p>
          </>
        )}
        <Link href="/dashboard" className="text-fedha-navy font-medium">Go to dashboard</Link>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailInner />
    </Suspense>
  );
}
