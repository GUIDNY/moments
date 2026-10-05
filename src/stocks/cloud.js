/**
 * The city in the account: what a signed-in player keeps on the server and
 * what friends may see of it. Three tables in Supabase, reached through
 * PostgREST with the player's own token, so the database's row-level rules
 * decide what is readable — the client is not the security boundary here
 * any more than it is for the photo bucket.
 *
 *   sc_cities    — the whole local state and progress, owner only
 *   sc_profiles  — name, level, badges, privacy and the packed city (what a
 *                  share link carries), readable by the owner and their friends
 *   sc_friends   — who added whom, by friend code
 */
import { SUPABASE_KEY, SUPABASE_URL } from '../lib/supabase';
import { getSession, getToken } from '../lib/auth';

async function rest(path, { method = 'GET', body, prefer } = {}) {
  const token = await getToken();
  if (!token) throw new Error('signed-out');
  const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = new Error(data?.message || data?.hint || `http-${res.status}`);
    err.status = res.status;
    err.detail = data;
    throw err;
  }
  return data;
}

const me = () => getSession()?.user?.id;

/** The saved city, or null when the account has none yet. */
export async function fetchCity() {
  const rows = await rest(`sc_cities?select=state,progress,updated_at&user_id=eq.${me()}`);
  return rows?.[0] ?? null;
}

/** Save the city; resolves the server's `updated_at`. */
export async function pushCity({ state, progress }) {
  const rows = await rest('sc_cities?on_conflict=user_id', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates,return=representation',
    body: { user_id: me(), state, progress },
  });
  return rows?.[0]?.updated_at ?? null;
}

export const fetchProfile = async () => (await rest(`sc_profiles?select=id,code,name,level,badges,privacy&id=eq.${me()}`))?.[0] ?? null;

export const pushProfile = (patch) => rest(`sc_profiles?id=eq.${me()}`, { method: 'PATCH', body: patch, prefer: 'return=minimal' });

/** The friends added by code, with what their profiles let us see. */
export async function listFriends() {
  const links = await rest(`sc_friends?select=friend_id&user_id=eq.${me()}`);
  const ids = (links || []).map((l) => l.friend_id);
  if (!ids.length) return [];
  const profiles = await rest(`sc_profiles?select=id,name,level,badges,privacy,city&id=in.(${ids.join(',')})`);
  return ids.map((id) => profiles.find((p) => p.id === id)).filter(Boolean);
}

/** Add a friend by their code; the error message says what went wrong. */
export async function addFriendByCode(code) {
  try {
    const rows = await rest('rpc/sc_add_friend', { method: 'POST', body: { friend_code: code } });
    return { friend: rows?.[0] ?? null, error: null };
  } catch (e) {
    const msg = String(e.message || '');
    return { friend: null, error: /own code/.test(msg) ? 'ownCode' : /no such code/.test(msg) ? 'badCode' : 'failed' };
  }
}

export const removeFriendById = (id) => rest(`sc_friends?user_id=eq.${me()}&friend_id=eq.${id}`, { method: 'DELETE', prefer: 'return=minimal' });
