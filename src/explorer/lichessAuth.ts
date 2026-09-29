/**
 * "Login with Lichess" via OAuth2 Authorization Code + PKCE, entirely client-side.
 * Lichess accepts unregistered public clients (any client_id, any absolute redirect_uri),
 * tokens are long-lived (~1 year) and the Opening Explorer only needs a token with no scopes.
 * Docs: https://lichess.org/api#section/Introduction/Authentication
 */
import { sha256 } from './sha256';

export const LICHESS = 'https://lichess.org';
const CLIENT_ID = 'cheness-opening-trainer';
const PKCE_KEY = 'cheness.lichess.pkce';

export interface LichessSession {
  token: string;
  username: string | null;
}

function randomBytes(n: number): Uint8Array {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return a;
}

export function base64url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** S256 code challenge. Uses Web Crypto when available, else a pure-JS SHA-256 (plain-HTTP LAN dev). */
export async function codeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  let digest: Uint8Array;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    digest = new Uint8Array(await crypto.subtle.digest('SHA-256', data));
  } else {
    digest = sha256(data);
  }
  return base64url(digest);
}

/** The app's own URL (origin + base path), used as redirect_uri. */
export function redirectUri(): string {
  return `${location.origin}${import.meta.env.BASE_URL}`;
}

/** Redirects the browser to Lichess. Returns only if something failed before the redirect. */
export async function startLogin(): Promise<void> {
  const verifier = base64url(randomBytes(48));
  const state = base64url(randomBytes(16));
  sessionStorage.setItem(PKCE_KEY, JSON.stringify({ verifier, state }));
  const p = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: redirectUri(),
    code_challenge_method: 'S256',
    code_challenge: await codeChallenge(verifier),
    state,
  });
  location.assign(`${LICHESS}/oauth?${p.toString()}`);
}

/**
 * If the current URL carries an OAuth `code`, exchange it for a token and clean the URL.
 * Returns the session or null when this page load is not an OAuth callback.
 */
export async function completeLoginFromUrl(): Promise<LichessSession | null> {
  const url = new URL(location.href);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code) return null;

  const cleanUrl = () => {
    url.searchParams.delete('code');
    url.searchParams.delete('state');
    url.searchParams.delete('error');
    history.replaceState(history.state, '', url.pathname + url.search + url.hash);
  };

  const raw = sessionStorage.getItem(PKCE_KEY);
  sessionStorage.removeItem(PKCE_KEY);
  if (!raw) {
    cleanUrl();
    return null;
  }
  const pkce = JSON.parse(raw) as { verifier: string; state: string };
  if (pkce.state !== state) {
    cleanUrl();
    throw new Error('OAuth state mismatch');
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    code_verifier: pkce.verifier,
    redirect_uri: redirectUri(),
    client_id: CLIENT_ID,
  });
  const res = await fetch(`${LICHESS}/api/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  cleanUrl();
  if (!res.ok) throw new Error(`Token exchange failed: HTTP ${res.status}`);
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error('Token exchange returned no token');
  const username = await fetchUsername(json.access_token);
  return { token: json.access_token, username };
}

export interface LichessAccountInfo {
  username: string;
  /** Rating per time control, e.g. { blitz: 1241, rapid: 1385 }. */
  perfs: Record<string, number>;
}

/** Account name and ratings for a token; null when the token is invalid or the request fails. */
export async function fetchAccount(
  token: string,
  signal?: AbortSignal,
): Promise<LichessAccountInfo | null> {
  try {
    const res = await fetch(`${LICHESS}/api/account`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      signal,
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      username?: string;
      perfs?: Record<string, { rating?: number }>;
    };
    if (!json.username) return null;
    const perfs: Record<string, number> = {};
    for (const [k, v] of Object.entries(json.perfs ?? {})) {
      if (v && typeof v.rating === 'number') perfs[k] = v.rating;
    }
    return { username: json.username, perfs };
  } catch {
    return null;
  }
}

export async function fetchUsername(token: string): Promise<string | null> {
  try {
    const res = await fetch(`${LICHESS}/api/account`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { username?: string };
    return json.username ?? null;
  } catch {
    return null;
  }
}

/** Revoke the token on Lichess (best effort). */
export async function revokeToken(token: string): Promise<void> {
  try {
    await fetch(`${LICHESS}/api/token`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // ignore: the local copy is dropped regardless
  }
}

/** Personal API tokens and OAuth tokens both match this. */
export function looksLikeToken(s: string): boolean {
  return /^[A-Za-z0-9_]{8,}$/.test(s.trim());
}
