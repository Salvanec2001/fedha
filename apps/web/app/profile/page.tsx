'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '../../components/NavBar';
import Footer from '../../components/Footer';
import { apiFetch, getToken } from '../../lib/api';
import { enablePushNotifications } from '../../lib/push';

type Profile = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
};

const MAX_AVATAR_BYTES = 500 * 1024;

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pushStatus, setPushStatus] = useState<string | null>(null);

  function load() {
    apiFetch('/users/me').then((p) => {
      setProfile(p);
      setName(p.name);
      setPhone(p.phone ?? '');
    }).catch((err) => setError(err.message));
  }

  useEffect(() => {
    if (!getToken()) { router.push('/login'); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  function initials(n: string) {
    return n.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (file.size > MAX_AVATAR_BYTES) {
      setError('Please choose an image under 500KB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        const updated = await apiFetch('/auth/profile', { method: 'PATCH', body: JSON.stringify({ avatarUrl: dataUrl }) });
        setProfile((p) => (p ? { ...p, avatarUrl: updated.avatarUrl } : p));
        setMessage('Profile photo updated.');
      } catch (err: any) {
        setError(err.message);
      }
    };
    reader.readAsDataURL(file);
  }

  async function saveDetails(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      await apiFetch('/auth/profile', { method: 'PATCH', body: JSON.stringify({ name }) });
      if (phone !== (profile?.phone ?? '')) {
        await apiFetch('/auth/phone', { method: 'POST', body: JSON.stringify({ phone }) });
      }
      setMessage('Profile updated.');
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
      setMessage('If SMS is configured, a code was sent.');
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

  async function handleEnablePush() {
    setPushStatus('checking');
    const result = await enablePushNotifications();
    setPushStatus(result);
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar />
      <div className="max-w-md mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full">
        <h1 className="text-2xl font-bold text-fedha-navy mb-6">Profile</h1>

        {error && <p className="text-fedha-red text-sm mb-3">{error}</p>}
        {message && <p className="text-fedha-green text-sm mb-3">{message}</p>}

        {profile && (
          <div className="bg-white rounded-xl border shadow-sm p-6 mb-4 text-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="relative mx-auto mb-3 block"
              aria-label="Change profile photo"
            >
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-fedha-gold mx-auto" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-fedha-navy text-white flex items-center justify-center text-2xl font-bold mx-auto">
                  {initials(profile.name)}
                </div>
              )}
              <span className="absolute bottom-0 right-0 bg-fedha-gold text-fedha-navy rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold border-2 border-white">
                ✎
              </span>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            <h2 className="font-bold text-lg text-fedha-navy">{profile.name}</h2>
            <p className="text-sm text-gray-500">{profile.email}</p>
            <p className={`text-xs mt-1 ${profile.emailVerified ? 'text-fedha-green' : 'text-fedha-amber'}`}>
              {profile.emailVerified ? '✓ Email verified' : 'Email not verified — check your inbox'}
            </p>
          </div>
        )}

        <form onSubmit={saveDetails} className="bg-white rounded-xl border p-6 shadow-sm mb-4">
          <h2 className="font-semibold text-fedha-navy mb-4">Personal details</h2>
          <label className="block text-sm font-medium mb-1">Full name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full mb-4 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-fedha-navy"
          />
          <label className="block text-sm font-medium mb-1">Phone number</label>
          <input
            placeholder="e.g. +255712345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full mb-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-fedha-navy"
          />
          {profile && (
            <p className={`text-xs mb-4 ${profile.phoneVerified ? 'text-fedha-green' : 'text-gray-400'}`}>
              {profile.phoneVerified ? '✓ Verified' : 'Not verified'}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="px-5 py-2.5 rounded-lg bg-fedha-navy text-white font-semibold hover:opacity-90 disabled:opacity-50"
          >
            Save changes
          </button>
        </form>

        {profile?.phone && !profile.phoneVerified && (
          <div className="bg-white rounded-xl border p-6 shadow-sm mb-4">
            <h2 className="font-semibold text-fedha-navy mb-4">Verify phone number</h2>
            {!codeSent ? (
              <button onClick={requestCode} disabled={busy} className="px-5 py-2.5 rounded-lg bg-fedha-navy text-white font-semibold hover:opacity-90 disabled:opacity-50">
                Send verification code
              </button>
            ) : (
              <form onSubmit={verifyCode}>
                <input
                  placeholder="6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full mb-3 px-3 py-2 border rounded-lg"
                />
                <button type="submit" disabled={busy} className="px-5 py-2.5 rounded-lg bg-fedha-navy text-white font-semibold hover:opacity-90 disabled:opacity-50">
                  Verify
                </button>
              </form>
            )}
          </div>
        )}

        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h2 className="font-semibold text-fedha-navy mb-2">Phone notifications</h2>
          <p className="text-xs text-gray-500 mb-4">
            Get free notifications on this phone when accounts, transactions, budgets, or goals are created —
            no SMS charges, works by adding Fedha to your home screen.
          </p>
          <button
            onClick={handleEnablePush}
            disabled={pushStatus === 'checking'}
            className="px-5 py-2.5 rounded-lg bg-fedha-navy text-white font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {pushStatus === 'checking' ? 'Enabling…' : 'Enable notifications on this device'}
          </button>
          {pushStatus === 'enabled' && <p className="text-xs text-fedha-green mt-3">Notifications enabled on this device.</p>}
          {pushStatus === 'denied' && <p className="text-xs text-fedha-red mt-3">Permission was denied. Enable notifications for this site in your browser settings.</p>}
          {pushStatus === 'unsupported' && <p className="text-xs text-gray-400 mt-3">Your browser doesn't support push notifications.</p>}
        </div>
      </div>
      <Footer />
    </main>
  );
}
