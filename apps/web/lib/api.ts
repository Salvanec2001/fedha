const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

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

export function formatMoney(amountInSmallestUnit: number, currency = 'TZS') {
  const major = amountInSmallestUnit / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    currencyDisplay: 'code',
  }).format(major);
}
