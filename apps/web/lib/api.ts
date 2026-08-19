const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://fedha-api-production.up.railway.app/api/v1';

// MVP token storage. Good enough for a solo, single-device Phase 2 app;
// the architecture doc flags httpOnly refresh cookies + short-lived access
// tokens as the hardening step before this goes further than personal use.
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('fedha_access_token');
}

export function setToken(token: string) {
  localStorage.setItem('fedha_access_token', token);
}

export function clearToken() {
  localStorage.removeItem('fedha_access_token');
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Request failed (${res.status})`);
  }

  if (res.status === 204) return null;
  return res.json();
}

// Formats an integer amount stored in the smallest currency unit (e.g. cents)
// into a human-readable string, e.g. 150000 -> "TZS 1,500.00"
export function formatMoney(amountInSmallestUnit: number, currency = 'TZS') {
  const major = amountInSmallestUnit / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    currencyDisplay: 'code',
  }).format(major);
}
