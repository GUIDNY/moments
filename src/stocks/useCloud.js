/**
 * Keeping the city in the account.
 *
 * The rules, in order, the first time a signed-in player's city is looked at
 * on this device:
 *   - the account has no city yet          → this one goes up
 *   - this device has nothing of its own   → the account's city comes down
 *   - the account is newer than our last
 *     sync here (another device wrote)     → the account's city comes down
 *   - synced here before, nothing newer    → this device's changes go up
 *   - never synced here, both have a city  → ask: which one? (`conflict`)
 * After that, every change goes up a moment later. "Our last sync" is kept
 * per account, so a second account on the same phone is asked, never
 * overwritten with the first one's city.
 *
 * Nothing here runs for a visited city (a share link), which is somebody
 * else's and never saved anywhere.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { authReady, sessionFromHash, useSession } from '../lib/auth';
import * as cloud from './cloud';

const atKey = (uid) => `stockcity.cloudAt:${uid}`;
const readAt = (uid) => {
  try {
    return Number(localStorage.getItem(atKey(uid))) || 0;
  } catch {
    return 0;
  }
};
const writeAt = (uid, ms) => {
  try {
    localStorage.setItem(atKey(uid), String(ms));
  } catch {
    /* ignore */
  }
};

const hasCity = (s) => Boolean(s && ((s.holdings?.length ?? 0) > 0 || (s.trades?.length ?? 0) > 0));

// a link from an email (confirmation, recovery) lands with tokens in the hash:
// read once, before anything renders
const landed = typeof window !== 'undefined' ? sessionFromHash() : null;

export function useCloud({ state, progress, applyCloud, packProfile, shared }) {
  const session = useSession();
  const uid = session?.user?.id ?? null;
  const [status, setStatus] = useState('idle'); // idle · syncing · synced · error
  const [conflict, setConflict] = useState(null); // the account's row, when both sides have a city
  const [profile, setProfile] = useState(null);
  const [linkType, setLinkType] = useState(landed?.type ?? null);
  const synced = useRef(null); // the uid whose first pull is done
  const latest = useRef({ state, progress, packProfile });
  latest.current = { state, progress, packProfile };
  const timer = useRef(null);

  const push = useCallback(async (who) => {
    const { state: s, progress: p, packProfile: pack } = latest.current;
    setStatus('syncing');
    try {
      const at = await cloud.pushCity({ state: s, progress: p });
      await cloud.pushProfile(pack());
      writeAt(who, at ? Date.parse(at) : Date.now());
      setStatus('synced');
    } catch {
      setStatus('error');
    }
  }, []);

  const refreshProfile = useCallback(() => {
    cloud.fetchProfile().then(setProfile, () => {});
  }, []);

  // the first look, once per account
  useEffect(() => {
    if (!authReady || shared || !uid || synced.current === uid) return;
    let gone = false;
    setStatus('syncing');
    // the profile (the friend code) is wanted at once, not after the first sync
    refreshProfile();
    (async () => {
      try {
        const row = await cloud.fetchCity();
        if (gone) return;
        const localAt = readAt(uid);
        const local = latest.current.state;
        if (!row) {
          synced.current = uid;
          await push(uid);
        } else if (!hasCity(local) || (localAt && Date.parse(row.updated_at) > localAt)) {
          applyCloud(row);
          writeAt(uid, Date.parse(row.updated_at));
          synced.current = uid;
          setStatus('synced');
        } else if (localAt || !hasCity(row.state)) {
          synced.current = uid;
          await push(uid);
        } else {
          setConflict(row);
          setStatus('idle');
        }
      } catch {
        if (!gone) setStatus('error');
      }
    })();
    return () => {
      gone = true;
    };
  }, [uid, shared, applyCloud, push, refreshProfile]);

  // signed out: the next account starts from its own first look
  useEffect(() => {
    if (!uid) {
      synced.current = null;
      setProfile(null);
      setConflict(null);
      setStatus('idle');
    }
  }, [uid]);

  // every change after that goes up a moment later
  useEffect(() => {
    if (!uid || shared || synced.current !== uid) return undefined;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => push(uid), 1500);
    return () => clearTimeout(timer.current);
  }, [state, progress, uid, shared, push]);

  const resolveConflict = useCallback(
    (choice) => {
      if (!conflict || !uid) return;
      if (choice === 'cloud') {
        applyCloud(conflict);
        writeAt(uid, Date.parse(conflict.updated_at));
        synced.current = uid;
        setStatus('synced');
      } else {
        synced.current = uid;
        push(uid);
      }
      setConflict(null);
    },
    [conflict, uid, applyCloud, push]
  );

  return { ready: authReady, session, status, conflict, resolveConflict, profile, refreshProfile, linkType, clearLink: () => setLinkType(null) };
}
