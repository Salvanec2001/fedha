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
    <nav className="bg-fedha-navy text-white px-6 py-4 flex items-center justify-between flex-wrap gap-2">
      <span className="font-bold text-lg">Fedha</span>
      <div className="flex gap-4 text-sm flex-wrap">
        <Link href="/dashboard" className="hover:text-fedha-gold">Dashboard</Link>
        <Link href="/accounts" className="hover:text-fedha-gold">Accounts</Link>
        <Link href="/transactions" className="hover:text-fedha-gold">Transactions</Link>
        <Link href="/budgets" className="hover:text-fedha-gold">Budgets</Link>
        <Link href="/goals" className="hover:text-fedha-gold">Goals</Link>
        <Link href="/reports" className="hover:text-fedha-gold">Reports</Link>
        <Link href="/profile" className="hover:text-fedha-gold">Profile</Link>
        <button onClick={logout} className="hover:text-fedha-gold">Log out</button>
      </div>
    </nav>
  );
}
