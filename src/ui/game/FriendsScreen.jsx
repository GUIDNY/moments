import { useMemo, useState } from 'react';
import { Check, Copy, ExternalLink, Link2, Lock, Trash2, Trophy, Users } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { useCity } from '../../stocks/CityContext';
import { addFriend, loadFriends, removeFriend, saveFriends } from '../../stocks/friends';
import { PRIVACY } from '../../stocks/store';
import { levelFor, xpFor } from '../../stocks/xp';
import { ACHIEVEMENTS } from '../../stocks/achievements';

/**
 * The neighbours. There is no server, so the social layer is links: your
 * city's link (as private as you set it), the links friends sent you, and
 * a ranking among them by level and badges — never by returns. Visiting
 * is opening the link; a visited city is read-only.
 *
 * `mode` is 'friends' or 'rankings': the same screen, two front pages.
 */
export default function FriendsScreen({ mode = 'friends' }) {
  const { t, loc } = useI18n();
  const { holdings, trades, positions, totalUsd, progress, privacy, setPrivacy, name, setName, shareUrl, isShared } = useCity();
  const [friends, setFriends] = useState(loadFriends);
  const [link, setLink] = useState('');
  const [friendName, setFriendName] = useState('');
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const me = useMemo(() => ({ name: name || t('profile.myCity'), level: levelFor(xpFor(progress, { holdings, trades, positions, totalUsd })).level, badges: progress.unlocked.length, holdings: holdings.length, me: true }), [name, progress, holdings, trades, positions, totalUsd, t]);

  const persist = (list) => {
    setFriends(list);
    saveFriends(list);
  };
  const add = () => {
    const { list, error: err } = addFriend(friends, link.trim(), friendName.trim());
    if (err) return setError(err);
    setError(null);
    setLink('');
    setFriendName('');
    persist(list);
  };
  const copy = () => {
    const url = shareUrl();
    if (!url) return;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }, () => {});
  };
  const visit = (f) => {
    window.location.assign(f.url);
  };

  const ranked = useMemo(() => [me, ...friends].sort((a, b) => b.level - a.level || b.badges - a.badges || b.holdings - a.holdings), [me, friends]);

  return (
    <div className="absolute inset-0 overflow-y-auto bg-paper-50 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-24">
      <div className="mx-auto max-w-2xl px-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] md:pt-6 space-y-3">
        <h1 className="text-[20px] font-black text-ink-900">{mode === 'rankings' ? t('nav.rankings') : t('nav.friends')}</h1>

        {mode === 'rankings' && (
          <section className="rounded-3xl bg-white border border-paper-200 shadow-card p-3">
            <p className="text-[12px] text-paper-muted px-1 pb-2 leading-snug">{t('rank.note')}</p>
            <ol className="divide-y divide-paper-100">
              {ranked.map((c, i) => (
                <li key={c.url ?? 'me'} className={`flex items-center gap-3 p-2.5 ${c.me ? 'bg-brand/8 rounded-2xl' : ''}`}>
                  <span className={`w-8 h-8 rounded-xl grid place-items-center text-[13px] font-black tabular-nums ${i === 0 ? 'bg-[#f5c542]/30 text-[#8a6508]' : 'bg-paper-100 text-ink-900'}`}>{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-black text-ink-900 truncate">{c.name || t('friends.unnamed')}{c.me ? ` · ${t('rank.you')}` : ''}</span>
                    <span className="block text-[11.5px] text-paper-muted">{t('profile.level', { n: c.level })} · {t('rank.badges', { n: c.badges })} · {t('rank.buildings', { n: c.holdings })}</span>
                  </span>
                  {!c.me && <button type="button" onClick={() => visit(c)} className="h-9 px-3 rounded-xl bg-brand text-white text-[12px] font-black">{t('visit.visit')}</button>}
                </li>
              ))}
            </ol>
            {friends.length === 0 && <p className="text-[13px] font-bold text-ink-900 text-center py-3">{t('empty.friends')}</p>}
          </section>
        )}

        {/* my city's link, and how much of it travels */}
        {!isShared && (
          <section className="rounded-3xl bg-white border border-paper-200 shadow-card p-4">
            <h2 className="text-[11px] font-black uppercase tracking-wide text-paper-muted">{t('friends.myLink')}</h2>
            <label className="block mt-2 text-[11px] font-bold text-paper-muted">
              {t('profile.rename')}
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('profile.myCity')} className="mt-1 w-full h-11 rounded-xl border border-paper-200 bg-paper-50 px-3 text-[14px] font-black text-ink-900 focus:outline-none focus:border-brand" />
            </label>
            <div className="grid grid-cols-3 gap-1.5 mt-3">
              {PRIVACY.map((p) => (
                <button key={p} type="button" onClick={() => setPrivacy(p)} className={`min-h-[52px] rounded-2xl border px-2 py-1.5 text-start ${privacy === p ? 'bg-ink-900 text-white border-ink-900' : 'bg-white text-ink-900 border-paper-200'}`}>
                  <span className="block text-[12.5px] font-black">{t(`privacy.${p}`)}</span>
                  <span className={`block text-[10.5px] leading-snug ${privacy === p ? 'text-white/70' : 'text-paper-muted'}`}>{t(`privacy.${p}Sub`)}</span>
                </button>
              ))}
            </div>
            <button type="button" onClick={copy} disabled={privacy === 'private'} className="mt-3 w-full h-12 rounded-2xl bg-brand text-white font-black text-[14px] shadow-fab disabled:opacity-40 inline-flex items-center justify-center gap-2">
              {privacy === 'private' ? <Lock size={16} aria-hidden="true" /> : copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
              {privacy === 'private' ? t('privacy.locked') : copied ? t('directory.copied') : t('directory.share')}
            </button>
          </section>
        )}

        {mode === 'friends' && (
          <>
            <section className="rounded-3xl bg-white border border-paper-200 shadow-card p-4">
              <h2 className="text-[11px] font-black uppercase tracking-wide text-paper-muted">{t('friends.add')}</h2>
              <p className="text-[12px] text-paper-muted mt-1 leading-snug">{t('friends.addHow')}</p>
              <input dir="ltr" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…?p=…" className="mt-2 w-full h-11 rounded-xl border border-paper-200 bg-paper-50 px-3 text-[12.5px] font-mono text-ink-900 focus:outline-none focus:border-brand" />
              <div className="flex gap-2 mt-2">
                <input value={friendName} onChange={(e) => setFriendName(e.target.value)} placeholder={t('friends.name')} className="flex-1 h-11 rounded-xl border border-paper-200 bg-paper-50 px-3 text-[13px] font-bold text-ink-900 focus:outline-none focus:border-brand" />
                <button type="button" onClick={add} disabled={!link.trim()} className="h-11 px-4 rounded-xl bg-ink-900 text-white font-black text-[13px] disabled:opacity-40 inline-flex items-center gap-1.5"><Link2 size={15} aria-hidden="true" />{t('friends.save')}</button>
              </div>
              {error && <p role="alert" className="mt-2 text-[12px] font-bold text-[#b2423f]">{t('friends.badLink')}</p>}
            </section>

            <section className="rounded-3xl bg-white border border-paper-200 shadow-card p-3">
              <h2 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-paper-muted px-1 pb-1"><Users size={13} aria-hidden="true" />{t('friends.list')}</h2>
              {friends.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-[14px] font-black text-ink-900">{t('empty.friends')}</p>
                  <p className="text-[12px] text-paper-muted mt-1">{t('friends.emptyBody')}</p>
                </div>
              ) : (
                <ul className="divide-y divide-paper-100">
                  {friends.map((f) => (
                    <li key={f.url} className="flex items-center gap-3 p-2.5">
                      <span className="w-11 h-11 rounded-2xl bg-brand/15 grid place-items-center text-xl">🏙️</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-black text-ink-900 truncate">{f.name || t('friends.unnamed')}</span>
                        <span className="block text-[11.5px] text-paper-muted">{t('profile.level', { n: f.level })} · {t('rank.badges', { n: f.badges })} · {t('rank.buildings', { n: f.holdings })}</span>
                      </span>
                      <button type="button" onClick={() => visit(f)} className="h-9 px-3 rounded-xl bg-brand text-white text-[12px] font-black inline-flex items-center gap-1"><ExternalLink size={13} aria-hidden="true" />{t('visit.visit')}</button>
                      <button type="button" onClick={() => persist(removeFriend(friends, f.url))} aria-label={t('preview.remove')} className="w-9 h-9 rounded-xl bg-paper-50 border border-paper-200 grid place-items-center text-ink-900"><Trash2 size={14} aria-hidden="true" /></button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}

        {mode === 'rankings' && (
          <section className="rounded-3xl bg-white border border-paper-200 shadow-card p-4">
            <h2 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-paper-muted"><Trophy size={13} aria-hidden="true" />{t('rank.howTitle')}</h2>
            <p className="text-[12.5px] text-ink-900/80 leading-relaxed mt-1">{t('rank.how', { n: ACHIEVEMENTS.length })}</p>
          </section>
        )}
      </div>
    </div>
  );
}
