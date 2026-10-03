import { useState } from 'react';
import { ClipboardPaste, Upload } from 'lucide-react';
import Sheet from '../Sheet';
import { useI18n } from '../../i18n/I18nContext';
import { useCity } from '../../stocks/CityContext';
import { parseHoldingsText, resolveRows, toHoldings } from '../../stocks/importer';

/**
 * Paste a broker's holdings table, see what the city made of it, fix a
 * symbol or two, import. Nothing leaves the browser but the symbols, for
 * prices — the same as any other holding.
 */
export default function ImportSheet({ open, onClose, onDone }) {
  const { t, loc } = useI18n();
  const { importPortfolio } = useCity();
  const [text, setText] = useState('');
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState(false);
  const [agorot, setAgorot] = useState(true);
  if (!open) return null;

  const read = async () => {
    setBusy(true);
    const parsed = parseHoldingsText(text);
    setRows(await resolveRows(parsed));
    setBusy(false);
  };
  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    f.text().then((s) => setText(s));
  };
  const patch = (i, p) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...p } : r)));
  const holdings = rows ? toHoldings(rows, { agorot }) : [];
  const go = () => {
    if (!holdings.length) return;
    if (!window.confirm(t('import.confirm', { n: holdings.length }))) return;
    importPortfolio(holdings);
    onDone?.(holdings.length);
    onClose();
  };

  return (
    <Sheet open onClose={onClose} title={`📥 ${t('import.title')}`} tone="paper">
      <p className="text-[12.5px] text-ink-900/80 leading-relaxed">{t('import.how')}</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('import.paste')}
        rows={5}
        dir="auto"
        className="mt-3 w-full rounded-2xl border border-paper-200 bg-white p-3 text-[12.5px] font-mono text-ink-900 focus:outline-none focus:border-brand"
      />
      <div className="flex gap-2 mt-2">
        <button type="button" onClick={read} disabled={!text.trim() || busy} className="flex-1 h-11 rounded-2xl bg-brand text-white font-black text-[13.5px] disabled:opacity-40 inline-flex items-center justify-center gap-1.5">
          <ClipboardPaste size={16} aria-hidden="true" />
          {t('import.parse')}
        </button>
        <label className="h-11 px-3.5 rounded-2xl bg-white border border-paper-200 text-ink-900 font-bold text-[12.5px] inline-flex items-center gap-1.5 cursor-pointer">
          <Upload size={15} aria-hidden="true" />
          CSV
          <input type="file" accept=".csv,.txt,.tsv,text/plain,text/csv" onChange={onFile} className="hidden" />
        </label>
      </div>

      {rows && (
        <div className="mt-3">
          <p className="text-[12px] font-bold text-paper-muted">{rows.length ? t('import.found', { n: rows.length }) : t('import.none')}</p>
          {rows.length > 0 && (
            <>
              <ul className="mt-2 space-y-1.5 max-h-[38vh] overflow-y-auto -mx-1 px-1">
                {rows.map((r, i) => (
                  <li key={i} className={`rounded-2xl border px-3 py-2 bg-white ${r.status === 'missing' ? 'border-[#e2706f]' : 'border-paper-200'}`}>
                    <div className="text-[12.5px] font-black text-ink-900 truncate">{loc(r.name)}</div>
                    <div className="grid grid-cols-3 gap-1.5 mt-1">
                      <label className="text-[10px] font-bold text-paper-muted">
                        {t('import.symbol')}
                        <input dir="ltr" value={r.symbol} onChange={(e) => patch(i, { symbol: e.target.value.toUpperCase(), status: e.target.value ? 'guess' : 'missing' })} placeholder={t('import.unresolved')} className="mt-0.5 w-full h-8 rounded-lg border border-paper-200 px-2 text-[12px] font-black text-ink-900" />
                      </label>
                      <label className="text-[10px] font-bold text-paper-muted">
                        {t('import.qty')}
                        <input dir="ltr" type="number" value={r.qty} onChange={(e) => patch(i, { qty: Number(e.target.value) })} className="mt-0.5 w-full h-8 rounded-lg border border-paper-200 px-2 text-[12px] font-black text-ink-900 tabular-nums" />
                      </label>
                      <label className="text-[10px] font-bold text-paper-muted">
                        {t('import.cost')}
                        <input dir="ltr" type="number" value={r.cost ?? ''} onChange={(e) => patch(i, { cost: e.target.value === '' ? null : Number(e.target.value) })} className="mt-0.5 w-full h-8 rounded-lg border border-paper-200 px-2 text-[12px] font-black text-ink-900 tabular-nums" />
                      </label>
                    </div>
                  </li>
                ))}
              </ul>
              <label className="flex items-center gap-2 mt-2 text-[12px] font-bold text-ink-900/80">
                <input type="checkbox" checked={agorot} onChange={(e) => setAgorot(e.target.checked)} className="accent-[#ff6b1a]" />
                {t('import.agorot')}
              </label>
              <button type="button" onClick={go} disabled={!holdings.length} className="mt-3 w-full h-12 rounded-2xl bg-brand text-white font-black text-[15px] shadow-fab disabled:opacity-40">
                {t('import.go')} · {holdings.length}
              </button>
            </>
          )}
        </div>
      )}
      <p className="text-[11px] text-paper-muted mt-3 leading-snug">{t('import.privacy')}</p>
    </Sheet>
  );
}
