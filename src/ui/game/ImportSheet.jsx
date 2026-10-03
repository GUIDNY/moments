import { useEffect, useState } from 'react';
import { Camera, ClipboardPaste, FileSpreadsheet } from 'lucide-react';
import Sheet from '../Sheet';
import { useI18n } from '../../i18n/I18nContext';
import { useCity } from '../../stocks/CityContext';
import { parseHoldingsText, resolveRows, toHoldings } from '../../stocks/importer';
import { readScreenshot, readSpreadsheet } from '../../stocks/ocr';
import { toMajor } from '../../stocks/money';

/**
 * Paste a broker's holdings table, see what the city made of it, fix a
 * symbol or two, import. Nothing leaves the browser but the symbols, for
 * prices — the same as any other holding.
 */
export default function ImportSheet({ open, onClose, onDone }) {
  const { t, loc } = useI18n();
  const { importPortfolio, ensureQuote, quoteOf } = useCity();
  const [text, setText] = useState('');
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState(false);
  const [agorot, setAgorot] = useState(true);
  const [progress, setProgress] = useState(null); // OCR percent, while a screenshot is read
  // live prices for the rows, so a cost a screenshot misread stands out
  const symbols = (rows || []).map((r) => r.symbol).filter(Boolean).join(',');
  useEffect(() => {
    if (!symbols) return;
    symbols.split(',').forEach((sym) => ensureQuote(sym));
  }, [symbols, ensureQuote]);
  const suspect = (r) => {
    const q = r.symbol ? quoteOf(r.symbol) : null;
    if (!q || !Number.isFinite(q.price) || r.cost == null) return false;
    const live = toMajor(q.price, q.currency).price;
    const cost = agorot && /\.TA$/i.test(r.symbol) ? r.cost / 100 : r.cost;
    return cost > live * 3 || cost < live / 3;
  };
  if (!open) return null;

  const readText = async (raw) => {
    setBusy(true);
    const parsed = parseHoldingsText(raw);
    setRows(await resolveRows(parsed));
    setBusy(false);
  };
  const read = () => readText(text);
  // a screenshot of the broker's app, read on the phone, then parsed as text
  const onPhoto = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setProgress(0);
    try {
      const got = await readScreenshot(f, setProgress);
      setText(got);
      await readText(got);
    } catch {
      setRows([]);
    } finally {
      setProgress(null);
    }
  };
  // an Excel export or a CSV, read as lines
  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const got = /\.xlsx?$/i.test(f.name) ? await readSpreadsheet(f) : await f.text();
    setText(got);
    await readText(got);
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
      <div className="grid grid-cols-2 gap-2 mt-3">
        <label className="h-14 rounded-2xl bg-brand text-white font-black text-[13px] shadow-fab inline-flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] transition-transform">
          <Camera size={18} aria-hidden="true" />
          {progress != null ? t('import.reading', { p: progress }) : t('import.photo')}
          <input type="file" accept="image/*" onChange={onPhoto} className="hidden" disabled={progress != null} />
        </label>
        <label className="h-14 rounded-2xl bg-white border border-paper-200 text-ink-900 font-black text-[13px] inline-flex items-center justify-center gap-2 cursor-pointer">
          <FileSpreadsheet size={18} aria-hidden="true" />
          {t('import.excel')}
          <input type="file" accept=".xlsx,.xls,.csv,.txt,.tsv,text/plain,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" onChange={onFile} className="hidden" />
        </label>
      </div>
      <p className="text-[11.5px] text-paper-muted mt-3">{t('import.typeHint')}</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('import.paste')}
        rows={4}
        dir="auto"
        className="mt-3 w-full rounded-2xl border border-paper-200 bg-white p-3 text-[12.5px] font-mono text-ink-900 focus:outline-none focus:border-brand"
      />
      <button type="button" onClick={read} disabled={!text.trim() || busy} className="mt-2 w-full h-11 rounded-2xl bg-white border border-paper-200 text-ink-900 font-black text-[13.5px] disabled:opacity-40 inline-flex items-center justify-center gap-1.5">
        <ClipboardPaste size={16} aria-hidden="true" />
        {t('import.parse')}
      </button>

      {rows && (
        <div className="mt-3">
          <p className="text-[12px] font-bold text-paper-muted">{rows.length ? t('import.found', { n: rows.length }) : t('import.none')}</p>
          {rows.length > 0 && (
            <>
              <ul className="mt-2 space-y-1.5 max-h-[38vh] overflow-y-auto -mx-1 px-1">
                {rows.map((r, i) => (
                  <li key={i} className={`rounded-2xl border px-3 py-2 bg-white ${r.status === 'missing' ? 'border-[#e2706f]' : suspect(r) ? 'border-[#f5c542]' : 'border-paper-200'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-[12.5px] font-black text-ink-900 truncate flex-1">{loc(r.name)}</span>
                      {suspect(r) && <span className="text-[10.5px] font-bold text-[#b8860b]">{t('import.checkCost')}</span>}
                    </div>
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
