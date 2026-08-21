'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '../../components/NavBar';
import { apiFetch, getToken } from '../../lib/api';

type Profile = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function load() {
    apiFetch('/users/me').then((p) => {
      setProfile(p);
      setPhone(p.phone ?? '');
    }).catch((err) => setError(err.message));
  }

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function savePhone(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      await apiFetch('/auth/phone', { method: 'POST', body: JSON.stringify({ phone }) });
      setMessage('Phone number saved.');
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function requestCode() {
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      await apiFetch('/auth/phone/request-verification', { method: 'POST' });
      setCodeSent(true);
      setMessage('If SMS is configured, a code was sent. Check your phone.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      await apiFetch('/auth/phone/verify', { method: 'POST', body: JSON.stringify({ code }) });
      setMessage('Phone number verified.');
      setCodeSent(false);
      setCode('');
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-md mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-fedha-navy mb-6">Profile</h1>

        {error && <p className="text-fedha-red text-sm mb-3">{error}</p>}
        {message && <p className="text-fedha-green text-sm mb-3">{message}</p>}

        {profile && (
          <div className="bg-white rounded-xl border p-6 shadow-sm mb-6">
            <p className="text-sm text-gray-500">Name</p>
            <p className="font-medium text-fedha-navy mb-3">{profile.name}</p>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium text-fedha-navy mb-1">{profile.email}</p>
            <p className={`text-xs ${profile.emailVerified ? 'text-fedha-green' : 'text-fedha-amber'}`}>
              {profile.emailVerified ? 'Verified' : 'Not verified — check your inbox for the verification email'}
            </p>
          </div>
        )}

        <form onSubmit={savePhone} className="bg-white rounded-xl border p-6 shadow-sm mb-4">
          <h2 className="font-semibold text-fedha-navy mb-4">Phone number</h2>
          <input
            placeholder="e.g. +255712345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full mb-3 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-fedha-navy"
          />
          <button
            type="submit"
            disabled={busy}
            className="px-5 py-2.5 rounded-lg bg-fedha-navy text-white font-semibold hover:opacity-90 disabled:opacity-50"
          >
            Save phone number
          </button>
          {profile && (
            <p className={`text-xs mt-3 ${profile.phoneVerified ? 'text-fedha-green' : 'text-gray-400'}`}>
              {profile.phoneVerified ? 'Verified' : 'Not verified'}
            </p>
          )}
        </form>

        {profile?.phone && !profile.phoneVerified && (
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <h2 className="font-semibold text-fedha-navy mb-4">Verify phone number</h2>
            {!codeSent ? (
              <button
                onClick={requestCode}
                disabled={busy}
                className="px-5 py-2.5 rounded-lg bg-fedha-navy text-white font-semibold hover:opacity-90 disabled:opacity-50"
              >
                Send verification code
              </button>
            ) : (
              <form onSubmit={verifyCode}>
                <input
                  placeholder="6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full mb-3 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-fedha-navy"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2.5 rounded-lg bg-fedha-navy text-white font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  Verify
                </button>
              </form>
            )}
            <p className="text-xs text-gray-400 mt-3">
              SMS delivery isn't configured yet — codes will be logged but not sent until that's set up.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
