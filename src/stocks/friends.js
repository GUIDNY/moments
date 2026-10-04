/**
 * The neighbours: other cities, saved as the links their owners shared.
 * There is no server, so a friend is a link and a name — what the link
 * carries (name, level, badges, holdings count) is what the list and the
 * rankings show, and visiting is opening the link. Nothing here ever
 * writes to a friend's city.
 */
import { peekLink } from './store';

const KEY = 'stockcity.friends';

export function loadFriends() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((f) => f && typeof f.url === 'string') : [];
  } catch {
    return [];
  }
}

export function saveFriends(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* private mode */
  }
}

/** Add a link; a link already saved is updated in place (its owner may have re-shared). */
export function addFriend(list, url, name = '') {
  const peek = peekLink(url);
  if (!peek) return { list, error: 'bad-link' };
  const entry = { url, name: name || peek.name || '', level: peek.level, badges: peek.badges, holdings: peek.holdings, savedAt: Date.now() };
  const at = list.findIndex((f) => f.url === url);
  const next = at >= 0 ? list.map((f, i) => (i === at ? { ...f, ...entry } : f)) : [...list, entry];
  return { list: next.slice(-50), error: null };
}

export const removeFriend = (list, url) => list.filter((f) => f.url !== url);
