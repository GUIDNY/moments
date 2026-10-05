import { useEffect, useState } from 'react';
import { Check, Cloud, CloudOff, Copy, KeyRound, LogIn, LogOut, UserPlus } from 'lucide-react';
import Sheet from '../Sheet';
import { useI18n } from '../../i18n/I18nContext';
import { useCity } from '../../stocks/CityContext';
import { recover, setPassword, signIn, signOut, signUp } from '../../lib/auth';

const INPUT = 'mt-1 w-full h-11 rounded-xl border border-paper-200 bg-paper-50 px-3 text-[14px] font-bold text-ink-900 focus:outline-none focus:border-brand';

/**
 * The account: an email and a password for this game, nothing else. Signing
 * in keeps the city on the server and brings it to another phone; the
 * friend code is how two players find each other. `mode` is 'signin' or,
 * after a password-reset link, 'recovery'.
 */
export default function AccountSheet({ open, onClose, mode = 'signin' }) {
  const { t } = useI18n();
  const { account } = useCity();
  const { session, profile, status, ready } = account;
  const [email, setEmail] = useState('');
  const [password, setPassword_] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);   // { tone: 'ok' | 'err', key }
  const [copied, setCopied] = useState(false);
  const [recovering, setRecovering] = useState(mode === 'recovery');
  useEffect(() => {
    if (open) {
      setNote(null);
      setRecovering(mode === 'recovery');
    }
  }, [open, mode]);

  const run = async (fn) => {
    setBusy(true);
    setNote(null);
    try {
      await fn();
    } catch (e) {
      setNote({ tone: 'err', key: `auth.${e?.code || 'failed'}` });
    } finally {
      setBusy(false);
    }
  };
  const doSignIn = () => run(async () => {
    await signIn(email.trim(), password);
    setPassword_('');
  });
  const doSignUp = () => run(async () => {
    const { confirm } = await signUp(email.trim(), password);
    setPassword_('');
    if (confirm) setNote({ tone: 'ok', key: 'auth.checkEmail' });
  });
  const doRecover = () => run(async () => {
    await recover(email.trim());
    setNote({ tone: 'ok', key: 'auth.sentReset' });
  });
  const doSetPassword = () => run(async () => {
    await setPassword(password);
    setPassword_('');
    setRecovering(false);
    setNote({ tone: 'ok', key: 'auth.passwordSet' });
    account.clearLink?.();
  });
  const copyCode = () => {
    if (!profile?.code) return;
    navigator.clipboard?.writeText(profile.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }, () => {});
  };

  const Note = note && (
    <p role={note.tone === 'err' ? 'alert' : 'status'} className={`mt-3 text-[12.5px] font-bold leading-snug ${note.tone === 'err' ? 'text-[#b2423f]' : 'text-[#2f7a4f]'}`}>{t(note.key)}</p>
  );

  return (
    <Sheet open={open} onClose={onClose} title={t('auth.title')}>
      {!ready ? (
        <p className="text-[13px] text-paper-muted">{t('auth.notConfigured')}</p>
      ) : session ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-2xl bg-paper-50 border border-paper-200 p-3">
            <span className="w-10 h-10 rounded-xl bg-brand/15 grid place-items-center text-brand-deep">{status === 'error' ? <CloudOff size={18} aria-hidden="true" /> : <Cloud size={18} aria-hidden="true" />}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] font-black text-ink-900 truncate" dir="ltr">{session.user.email}</span>
              <span className="block text-[11.5px] text-paper-muted">{t(status === 'syncing' ? 'auth.syncing' : status === 'error' ? 'auth.syncError' : 'auth.synced')}</span>
            </span>
          </div>
          {recovering ? (
            <div>
              <label className="block text-[11px] font-bold text-paper-muted">{t('auth.newPassword')}
                <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword_(e.target.value)} className={INPUT} dir="ltr" />
              </label>
              <button type="button" onClick={doSetPassword} disabled={busy || password.length < 6} className="mt-2 w-full h-12 rounded-2xl bg-brand text-white font-black text-[14px] shadow-fab disabled:opacity-40 inline-flex items-center justify-center gap-2"><KeyRound size={16} aria-hidden="true" />{t('auth.setPassword')}</button>
            </div>
          ) : (
            <div className="rounded-2xl border border-paper-200 p-3">
              <p className="text-[11px] font-black uppercase tracking-wide text-paper-muted">{t('auth.code')}</p>
              <div className="flex items-center gap-2 mt-1">
                <span dir="ltr" className="flex-1 text-[22px] font-black tracking-[0.2em] text-ink-900 tabular-nums">{profile?.code ?? '······'}</span>
                <button type="button" onClick={copyCode} disabled={!profile?.code} aria-label={t('auth.copy')} className="h-10 px-3 rounded-xl bg-ink-900 text-white text-[12px] font-black inline-flex items-center gap-1.5 disabled:opacity-40">{copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}{copied ? t('auth.copied') : t('auth.copy')}</button>
              </div>
              <p className="text-[12px] text-paper-muted mt-1.5 leading-snug">{t('auth.codeHow')}</p>
            </div>
          )}
          {Note}
          <button type="button" onClick={() => run(signOut)} disabled={busy} className="w-full h-11 rounded-2xl bg-white border border-paper-200 text-ink-900 font-bold text-[13px] inline-flex items-center justify-center gap-2"><LogOut size={15} aria-hidden="true" />{t('auth.signOut')}</button>
          <p className="text-[11.5px] text-paper-muted leading-snug">{t('auth.keepsLocal')}</p>
        </div>
      ) : (
        <div>
          <p className="text-[12.5px] text-ink-900/80 leading-relaxed">{t('auth.why')}</p>
          <label className="block mt-3 text-[11px] font-bold text-paper-muted">{t('auth.email')}
            <input type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} className={INPUT} dir="ltr" />
          </label>
          <label className="block mt-2 text-[11px] font-bold text-paper-muted">{t('auth.password')}
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword_(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && email && password && doSignIn()} className={INPUT} dir="ltr" />
          </label>
          {Note}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button type="button" onClick={doSignIn} disabled={busy || !email.trim() || !password} className="h-12 rounded-2xl bg-brand text-white font-black text-[14px] shadow-fab disabled:opacity-40 inline-flex items-center justify-center gap-2"><LogIn size={16} aria-hidden="true" />{t('auth.signIn')}</button>
            <button type="button" onClick={doSignUp} disabled={busy || !email.trim() || password.length < 6} className="h-12 rounded-2xl bg-ink-900 text-white font-black text-[14px] disabled:opacity-40 inline-flex items-center justify-center gap-2"><UserPlus size={16} aria-hidden="true" />{t('auth.signUp')}</button>
          </div>
          <button type="button" onClick={doRecover} disabled={busy || !email.trim()} className="mt-2 w-full h-10 rounded-2xl text-[12px] font-bold text-paper-muted disabled:opacity-40">{t('auth.forgot')}</button>
          <p className="mt-2 text-[11px] text-paper-muted leading-snug">{t('auth.noBroker')}</p>
        </div>
      )}
    </Sheet>
  );
}
