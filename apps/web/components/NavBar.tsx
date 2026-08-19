'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { clearToken } from '../lib/api';

export default function NavBar() {
  const router = useRouter();

  function logout() {
    clearToken();
    router.push('/login');
  }

  return (
    <nav className="bg-fedha-navy text-white px-6 py-4 flex items-center justify-between">
      <span className="font-bold text-lg">Fedha</span>
      <div className="flex gap-6 text-sm">
        <Link href="/dashboard" className="hover:text-fedha-gold">Dashboard</Link>
        <Link href="/accounts" className="hover:text-fedha-gold">Accounts</Link>
        <Link href="/transactions" className="hover:text-fedha-gold">Transactions</Link>
        <button onClick={logout} className="hover:text-fedha-gold">Log out</button>
      </div>
    </nav>
  );
}
