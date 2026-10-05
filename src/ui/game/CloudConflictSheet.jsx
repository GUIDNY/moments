import { Cloud, Smartphone } from 'lucide-react';
import Sheet from '../Sheet';
import { useI18n } from '../../i18n/I18nContext';
import { useCity } from '../../stocks/CityContext';

/**
 * The first sign-in on a device that already has a city of its own, when the
 * account has one too: the player picks, and nothing is overwritten quietly.
 */
export default function CloudConflictSheet() {
  const { t } = useI18n();
  const { account } = useCity();
  const { conflict, resolveConflict } = account;
  if (!conflict) return null;
  const n = conflict.state?.holdings?.length ?? 0;
  return (
    <Sheet open onClose={() => {}} dismissable={false} title={t('auth.conflictTitle')}>
      <p className="text-[13px] text-ink-900/80 leading-relaxed">{t('auth.conflictBody', { n })}</p>
      <div className="grid gap-2 mt-3">
        <button type="button" onClick={() => resolveConflict('cloud')} className="h-12 rounded-2xl bg-brand text-white font-black text-[14px] shadow-fab inline-flex items-center justify-center gap-2"><Cloud size={16} aria-hidden="true" />{t('auth.useCloud')}</button>
        <button type="button" onClick={() => resolveConflict('local')} className="h-12 rounded-2xl bg-white border border-paper-200 text-ink-900 font-black text-[14px] inline-flex items-center justify-center gap-2"><Smartphone size={16} aria-hidden="true" />{t('auth.useLocal')}</button>
      </div>
    </Sheet>
  );
}
