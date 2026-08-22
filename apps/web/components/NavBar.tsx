'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearToken } from '../lib/api';

const LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/accounts', label: 'Accounts' },
  { href: '/transactions', label: 'Transactions' },
  { href: '/budgets', label: 'Budgets' },
  { href: '/goals', label: 'Savings Goals' },
  { href: '/reports', label: 'Reports' },
  { href: '/profile', label: 'Profile' },
];

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function logout() {
    clearToken();
    router.push('/login');
  }

  return (
    <nav className="bg-fedha-navy text-white px-4 sm:px-6 py-3 sm:py-4 relative z-40">
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="font-bold text-lg tracking-tight">
          Fedha
        </Link>

        <button
          onClick={() => setOpen(!open)}
          aria-label="Open menu"
          aria-expanded={open}
          className="p-2 -mr-2 rounded-lg hover:bg-white/10 transition"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <>
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </>
            )}
          </svg>
        </button>
      </div>

      {open && (
        <>
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/30 z-30"
          />
          <div className="absolute right-4 sm:right-6 top-full mt-2 w-60 bg-white text-fedha-navy rounded-xl shadow-lg border overflow-hidden z-40">
            {LINKS.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`block px-4 py-3 text-sm font-medium border-b last:border-b-0 transition ${
                    active ? 'bg-fedha-navy/5 text-fedha-navy' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
            <button
              onClick={logout}
              className="block w-full text-left px-4 py-3 text-sm font-medium text-fedha-red hover:bg-gray-50"
            >
              Log out
            </button>
          </div>
        </>
      )}
    </nav>
  );
}
