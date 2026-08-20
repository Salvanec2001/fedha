const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://fedha-api-production.up.railway.app/api/v1';

// MVP token storage: good enough for a solo, single-device app.
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('fedha_access_token');
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('fedha_refresh_token');
}

export function setTokens(accessToken: string, refreshToken?: string) {
  localStorage.setItem('fedha_access_token', accessToken);
  if (refreshToken) localStorage.setItem('fedha_refresh_token', refreshToken);
}

// Kept for backward compatibility with existing call sites.
export function setToken(accessToken: string) {
  localStorage.setItem('fedha_access_token', accessToken);
}

export function clearToken() {
  localStorage.removeItem('fedha_access_token');
  localStorage.removeItem('fedha_refresh_token');
}

let refreshPromise: Promise<boolean> | null = null;

// Tries to exchange the stored refresh token for a new access token.
// Returns true on success. De-duplicates concurrent refresh attempts so
// multiple failed requests firing at once don't race each other.
async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    }
  })();

  const result = await refreshPromise;
  refreshPromise = null;
  return result;
}

export async function apiFetch(path: string, options: RequestInit = {}, _isRetry = false): Promise<any> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (res.status === 401 && !_isRetry) {
    // Access token likely expired — try a silent refresh and retry once
    // before giving up, instead of surfacing "Unauthorized" to the user.
    const refreshed = await tryRefresh();
    if (refreshed) {
      return apiFetch(path, options, true);
    }
    clearToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Your session expired. Please log in again.');
  }

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
