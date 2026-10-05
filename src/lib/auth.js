/**
 * Just enough Supabase Auth to sign a player in — and no SDK, as with the
 * storage client beside it. GoTrue is a plain REST API: sign up and sign in
 * return a session (an access token, a refresh token and when it expires),
 * the refresh token buys a new one, and a link in an email lands back here
 * with the tokens in the URL hash. The session lives in localStorage so a
 * reload is still signed in, and every reader gets it through `getToken()`,
 * which refreshes a minute before it would expire.
 *
 * No broker credentials ever come near this: an account is an email and a
 * password for *this* game, used to keep the city and to find friends.
 */
import { useSyncExternalStore } from 'react';
import { SUPABASE_KEY, SUPABASE_URL } from './supabase';

const KEY = 'stockcity.session';
export const authReady = Boolean(SUPABASE_URL && SUPABASE_KEY);

let session = read();
const listeners = new Set();

function read() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    return raw && raw.access_token && raw.refresh_token && raw.user?.id ? raw : null;
  } catch {
    return null;
  }
}

function write(next) {
  session = next;
  try {
    if (next) localStorage.setItem(KEY, JSON.stringify(next));
    else localStorage.removeItem(KEY);
  } catch {
    /* private mode: signed in until the tab closes */
  }
  for (const fn of listeners) fn(session);
}

const fromResponse = (data) =>
  data && data.access_token
    ? {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Number(data.expires_at) || Math.floor(Date.now() / 1000) + (Number(data.expires_in) || 3600),
        user: { id: data.user?.id, email: data.user?.email || '' },
      }
    : null;

/** An error code the UI can put into words: see `auth.*` in the strings. */
export class AuthError extends Error {
  constructor(code, detail) {
    super(code);
    this.code = code;
    this.detail = detail;
  }
}

const codeOf = (status, body) => {
  const raw = String(body?.error_code || body?.code || body?.error || body?.msg || body?.message || '').toLowerCase();
  if (/invalid_credentials|invalid login|invalid_grant/.test(raw)) return 'badLogin';
  if (/email_not_confirmed|not confirmed/.test(raw)) return 'confirmFirst';
  if (/already|exists|user_already/.test(raw) || status === 422) return 'exists';
  if (/weak_password|password should|at least/.test(raw)) return 'weak';
  if (/rate.?limit|too many/.test(raw) || status === 429) return 'rateLimit';
  if (/validation_failed|invalid.*email|unable to validate/.test(raw)) return 'badEmail';
  return 'failed';
};

async function call(path, { method = 'POST', body, token, raw = false } = {}) {
  if (!authReady) throw new AuthError('notConfigured');
  let res;
  try {
    res = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
      method,
      headers: {
        apikey: SUPABASE_KEY,
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token || SUPABASE_KEY}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new AuthError('offline');
  }
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) throw new AuthError(codeOf(res.status, data), data?.msg || data?.error_description || data?.message);
  return raw ? { status: res.status, data } : data;
}

/* ── the public surface ─────────────────────────────────────────────────── */

export const getSession = () => session;
export const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
/** The session as React state: re-renders on sign-in and sign-out. */
export const useSession = () => useSyncExternalStore(subscribe, getSession, () => null);

/**
 * Sign up. With email confirmation on (the project's default) GoTrue answers
 * with a user and no session: the player has an email to open first.
 * Resolves `{ confirm: true }` in that case, `{ confirm: false }` when the
 * session is live at once.
 */
export async function signUp(email, password) {
  const data = await call('signup', { body: { email, password } });
  const s = fromResponse(data);
  if (s) {
    write(s);
    return { confirm: false };
  }
  return { confirm: true };
}

export async function signIn(email, password) {
  const data = await call('token?grant_type=password', { body: { email, password } });
  const s = fromResponse(data);
  if (!s) throw new AuthError('failed');
  write(s);
  return s;
}

/** A password-reset email; the link comes back here with `type=recovery`. */
export const recover = (email) => call('recover', { body: { email, gotrue_meta_security: {} } });

/** Set a new password for the signed-in user (after a recovery link). */
export async function setPassword(password) {
  const token = await getToken();
  if (!token) throw new AuthError('failed');
  await call('user', { method: 'PUT', body: { password }, token });
}

export async function signOut() {
  const s = session;
  write(null);
  if (s) call('logout', { token: s.access_token }).catch(() => {});
}

/** A valid access token, refreshed when it is about to expire; null when signed out. */
export async function getToken() {
  if (!session) return null;
  if (session.expires_at - 60 > Date.now() / 1000) return session.access_token;
  try {
    const data = await call('token?grant_type=refresh_token', { body: { refresh_token: session.refresh_token } });
    const s = fromResponse(data);
    if (!s) throw new AuthError('failed');
    write(s);
    return s.access_token;
  } catch (e) {
    // a refresh token that was revoked is a sign-out, not a retry loop
    if (e.code !== 'offline') write(null);
    return null;
  }
}

/**
 * A confirmation, magic-link or recovery link lands with the tokens in the
 * hash. Read them once, keep the session, clean the URL, and say which kind
 * of link it was so the UI can ask for a new password after a recovery.
 */
export function sessionFromHash() {
  if (typeof window === 'undefined' || !window.location.hash.includes('access_token=')) return null;
  const params = new URLSearchParams(window.location.hash.slice(1));
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (!access_token || !refresh_token) return null;
  let user = { id: null, email: '' };
  try {
    const payload = JSON.parse(atob(access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    user = { id: payload.sub, email: payload.email || '' };
  } catch {
    /* an odd token: the first refresh will sort it out or sign out */
  }
  write({ access_token, refresh_token, expires_at: Number(params.get('expires_at')) || Math.floor(Date.now() / 1000) + 3600, user });
  const type = params.get('type') || 'signup';
  try {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  } catch {
    /* ignore */
  }
  return { type };
}
