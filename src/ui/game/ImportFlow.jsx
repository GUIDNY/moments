import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, Camera, Check, FileSpreadsheet, Landmark, Loader2, Pencil, Search, Sparkles, Trash2, Undo2, X } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { useCity } from '../../stocks/CityContext';
import { BOARD_BY_SYMBOL, SECTOR_BY_ID } from '../../stocks/catalog';
import { diffHoldings, parseBrokerFile, resolvePositions, toHoldings, validatePosition } from '../../stocks/broker';
import { parseHoldingsText } from '../../stocks/importer';
import { readScreenshot } from '../../stocks/ocr';
import { formatMoney, formatPct, rateBetween, toMajor } from '../../stocks/money';
import { DEMO, DEMO_CASH_USD, demoHoldings } from '../../stocks/demo';
import { moveColor } from '../../stocks/towers';

/**
 * Connecting a portfolio, as one flow on one screen:
 *
 *   connect → reading (file · securities · city) → preview → build → city
 *
 * The file is read by header names (`stocks/broker.js`), every security is
 * resolved against the catalogue and the market, and nothing unrecognised
 * is guessed: it is shown with a warning and the user fixes or removes it.
 * A second import of the same account is a diff, not a new city — what
 * will be built, grown, shrunk or demolished is listed before the button.
 * Nothing leaves the browser but the symbols, for prices.
 */

const BUILD_MS = 1600;

function positionsFromText(text) {
  return parseHoldingsText(text).map((r, i) => ({
    id: `${i}`, securityId: null, symbol: r.symbolHint, name: r.name, assetType: 'stock', currency: null,
    quantity: r.qty, marketPrice: null, marketValue: null, averagePrice: r.cost, costBasis: null,
    dailyChangePercent: null, dailyPnL: null, totalPnL: null, totalPnLPercent: null, portfolioWeight: null,
  }));
}

function Option({ Icon, title, sub, onClick, accept, onFile, tint = '#44e092', primary = false }) {
  const inner = (
    <>
      <span className="w-11 h-11 shrink-0 rounded-2xl grid place-items-center" style={{ background: `${tint}26`, color: tint }}>
        <Icon size={22} strokeWidth={2.3} aria-hidden="true" />
      </span>
      <span className="min-w-0 text-start">
        <span className="block text-[14px] font-black text-ink-900 leading-tight">{title}</span>
        <span className="block text-[11.5px] text-paper-muted leading-snug mt-0.5">{sub}</span>
      </span>
    </>
  );
  const cls = `w-full min-h-[64px] rounded-3xl border px-3 py-3 flex items-center gap-3 active:scale-[0.99] transition-transform cursor-pointer ${primary ? 'bg-white border-brand shadow-card' : 'bg-white border-paper-200 shadow-card'}`;
  if (accept) {
    return (
      <label className={cls}>
        {inner}
        <input type="file" accept={accept} onChange={onFile} className="hidden" />
      </label>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

const FILE_ACCEPT = '.xlsx,.xls,.csv,.txt,.tsv,text/plain,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel';

export default function ImportFlow({ open, onClose, onManual }) {
  const { t, loc } = useI18n();
  const { holdings, importPortfolio, ensureQuote, quoteOf, rates } = useCity();
  const [step, setStep] = useState('connect'); // connect · reading · preview · build
  const [phase, setPhase] = useState('file'); // file · resolve · build
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [text, setText] = useState('');
  const [source, setSource] = useState('generic');
  const [rows, setRows] = useState([]);
  const [fileCash, setFileCash] = useState([]);
  const [agorot, setAgorot] = useState(true);
  const [editing, setEditing] = useState(null);
  const [, bump] = useState(0);
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);
  useEffect(() => {
    if (open) {
      setStep('connect');
      setError(null);
      setRows([]);
      setFileCash([]);
      setEditing(null);
    }
  }, [open]);
  if (!open) return null;

  /* ── reading ──────────────────────────────────────────────────────────── */
  const fail = (code) => {
    setError(code);
    setStep('connect');
    setProgress(null);
  };
  const resolveAndPreview = async (positions, src, cash = []) => {
    setPhase('resolve');
    try {
      const resolved = await resolvePositions(positions);
      await Promise.all(resolved.filter((p) => p.symbol).map((p) => ensureQuote(p.symbol)));
      // the cash needs its dollar rate too
      for (const c of cash) if (c.currency !== 'USD') await ensureQuote(`${c.currency}USD=X`);
      if (!live.current) return;
      setRows(resolved.map((p) => ({ ...p, removed: false })));
      setFileCash(cash);
      setSource(src);
      setStep('preview');
      bump((n) => n + 1);
    } catch {
      fail('network');
    }
  };
  const fromFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setError(null);
    setStep('reading');
    setPhase('file');
    let got;
    try {
      got = await parseBrokerFile(f);
    } catch {
      return fail('readFile');
    }
    if (!got) return fail('format');
    await resolveAndPreview(got.positions, got.source, got.cash);
  };
  const fromPhoto = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setError(null);
    setStep('reading');
    setPhase('file');
    setProgress(0);
    try {
      const read = await readScreenshot(f, (p) => live.current && setProgress(p));
      setProgress(null);
      const positions = positionsFromText(read);
      if (!positions.length) return fail('format');
      await resolveAndPreview(positions, 'generic');
    } catch {
      fail('readFile');
    }
  };
  const fromText = async () => {
    const positions = positionsFromText(text);
    if (!positions.length) return fail('format');
    setError(null);
    setStep('reading');
    await resolveAndPreview(positions, 'generic');
  };
  const demo = async () => {
    setError(null);
    setStep('reading');
    setPhase('resolve');
    try {
      await Promise.all(DEMO.map((d) => ensureQuote(d.symbol)));
      const priceOf = (sym) => {
        const q = quoteOf(sym);
        return q && !q.error ? toMajor(q.price, q.currency).price : null;
      };
      build(demoHoldings(priceOf), DEMO_CASH_USD, false);
    } catch {
      fail('network');
    }
  };

  /* ── preview numbers ──────────────────────────────────────────────────── */
  const kept = rows.filter((r) => !r.removed);
  const holdingsOut = toHoldings(kept, { agorot });
  const priced = kept.map((r) => {
    const q = r.symbol ? quoteOf(r.symbol) : null;
    if (!q || q.error || !Number.isFinite(q.price)) return { r, usd: null, dayUsd: null, livePrice: null };
    const { price, currency } = toMajor(q.price, q.currency);
    const prev = toMajor(q.prevClose ?? q.price, q.currency).price;
    const rate = rateBetween(currency, 'USD', rates) ?? (currency === 'USD' ? 1 : null);
    const usd = rate != null && r.quantity > 0 ? r.quantity * price * rate : null;
    const dayUsd = rate != null && r.quantity > 0 ? r.quantity * (price - prev) * rate : null;
    return { r, usd, dayUsd, livePrice: price, dayPct: prev ? ((price - prev) / prev) * 100 : null };
  });
  const totalUsd = priced.reduce((s, x) => s + (x.usd ?? 0), 0);
  const dayTotal = priced.reduce((s, x) => s + (x.dayUsd ?? 0), 0);
  const cashUsd = fileCash.length
    ? fileCash.reduce((s, c) => {
        const rate = c.currency === 'USD' ? 1 : rateBetween(c.currency, 'USD', rates) ?? quoteOf(`${c.currency}USD=X`)?.price ?? null;
        return rate == null || s == null ? null : s + c.amount * rate;
      }, 0)
    : null;
  const warningsOf = (x) => validatePosition(x.r, x.livePrice != null && agorot && /\.TA$/i.test(x.r.symbol || '') ? x.livePrice * 100 : x.livePrice);
  const skipped = priced.filter((x) => warningsOf(x).some((w) => w === 'unknown' || w === 'qty')).length;
  const diff = holdings.length ? diffHoldings(holdings, holdingsOut) : null;
  const nameOf = (symbol) => loc(holdings.find((h) => h.symbol === symbol)?.name) || loc(rows.find((r) => r.symbol === symbol)?.display) || symbol;

  /* ── build ────────────────────────────────────────────────────────────── */
  const build = (out, cash, real = true) => {
    setStep('build');
    setPhase('build');
    setTimeout(() => {
      importPortfolio(out, { cashUsd: Number.isFinite(cash) ? cash : null, real });
      if (live.current) onClose?.(out.length);
    }, BUILD_MS);
  };
  const patch = (id, p) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));

  /* ── screens ──────────────────────────────────────────────────────────── */
  const phases = [
    ['file', t('reading.file')],
    ['resolve', t('reading.resolve')],
    ['build', t('reading.build')],
  ];
  const phaseAt = phases.findIndex(([id]) => id === phase);

  return (
    <div className="ui-layer fixed inset-0 z-[55] bg-paper-50 overflow-y-auto" role="dialog" aria-modal="true" aria-label={t('connect.title')}>
      <header className="sticky top-0 z-10 bg-paper-50/95 backdrop-blur-md border-b border-paper-200">
        <div className="mx-auto max-w-2xl px-4 h-[calc(3.5rem+env(safe-area-inset-top,0px))] pt-[env(safe-area-inset-top,0px)] flex items-center gap-2">
          {step === 'preview' ? (
            <button type="button" onClick={() => setStep('connect')} aria-label={t('common.back')} className="w-10 h-10 rounded-xl bg-white border border-paper-200 grid place-items-center text-ink-900"><ArrowLeft size={18} className="rtl:-scale-x-100" aria-hidden="true" /></button>
          ) : (
            <span className="w-10" />
          )}
          <h1 className="flex-1 text-center text-[14px] font-black text-ink-900">{step === 'preview' ? t('preview.title') : t('connect.title')}</h1>
          <button type="button" onClick={() => onClose?.()} aria-label={t('panel.close')} className="w-10 h-10 rounded-xl bg-white border border-paper-200 grid place-items-center text-ink-900" disabled={step === 'build'}><X size={18} aria-hidden="true" /></button>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-4 pb-[calc(2rem+env(safe-area-inset-bottom,0px))]">
        {step === 'connect' && (
          <>
            <p className="text-[13.5px] text-ink-900/75 leading-relaxed">{t('connect.sub')}</p>
            {error && (
              <div role="alert" className="mt-3 rounded-2xl bg-[#e2706f]/10 border border-[#e2706f]/40 px-3 py-2.5 text-[12.5px] font-bold text-[#b2423f]">
                {t(error === 'readFile' ? 'error.readFile' : error === 'format' ? 'error.format' : 'error.network')}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
              <Option Icon={FileSpreadsheet} title={t('connect.meitav')} sub={t('connect.meitavSub')} accept={FILE_ACCEPT} onFile={fromFile} tint="#ff6b1a" primary />
              <Option Icon={FileSpreadsheet} title={t('connect.file')} sub={t('connect.fileSub')} accept={FILE_ACCEPT} onFile={fromFile} tint="#4caf7d" />
              <Option Icon={Camera} title={t('connect.photo')} sub={t('connect.photoSub')} accept="image/*" onFile={fromPhoto} tint="#7db7ff" />
              <Option Icon={Search} title={t('connect.manual')} sub={t('connect.manualSub')} onClick={() => { onClose?.(); onManual?.(); }} tint="#b58cf0" />
            </div>
            <button type="button" onClick={demo} className="mt-2 w-full min-h-[56px] rounded-3xl bg-ink-900 text-white px-4 flex items-center gap-3 active:scale-[0.99] transition-transform">
              <span className="w-10 h-10 rounded-2xl bg-white/15 grid place-items-center"><Sparkles size={20} aria-hidden="true" /></span>
              <span className="text-start">
                <span className="block text-[14px] font-black leading-tight">{t('connect.demo')}</span>
                <span className="block text-[11.5px] text-white/70 leading-snug">{t('connect.demoSub')}</span>
              </span>
            </button>
            <p className="text-[11.5px] font-bold text-paper-muted mt-5">{t('connect.paste')}</p>
            <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t('import.paste')} rows={3} dir="auto" className="mt-1.5 w-full rounded-2xl border border-paper-200 bg-white p-3 text-[12.5px] font-mono text-ink-900 focus:outline-none focus:border-brand" />
            <button type="button" onClick={fromText} disabled={!text.trim()} className="mt-2 w-full h-11 rounded-2xl bg-white border border-paper-200 text-ink-900 font-black text-[13px] disabled:opacity-40">
              {t('import.parse')}
            </button>
            <div className="mt-5 rounded-2xl bg-white border border-paper-200 p-3.5 space-y-1.5">
              <p className="flex items-start gap-2 text-[12px] text-ink-900/80 leading-snug"><Check size={14} className="shrink-0 mt-0.5 text-[#4caf7d]" aria-hidden="true" />{t('connect.security1')}</p>
              <p className="flex items-start gap-2 text-[12px] text-ink-900/80 leading-snug"><Check size={14} className="shrink-0 mt-0.5 text-[#4caf7d]" aria-hidden="true" />{t('connect.security2')}</p>
            </div>
          </>
        )}

        {(step === 'reading' || step === 'build') && (
          <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
            <Landmark size={40} className="text-brand" aria-hidden="true" />
            <ol className="mt-6 space-y-3 w-full max-w-xs" aria-live="polite">
              {phases.map(([id, label], i) => (
                <li key={id} className={`flex items-center gap-3 text-[14px] font-black ${i < phaseAt ? 'text-paper-muted' : i === phaseAt ? 'text-ink-900' : 'text-paper-300'}`}>
                  <span className="w-7 h-7 rounded-full grid place-items-center bg-white border border-paper-200">
                    {i < phaseAt ? <Check size={14} className="text-[#4caf7d]" aria-hidden="true" /> : i === phaseAt ? <Loader2 size={14} className="animate-spin text-brand" aria-hidden="true" /> : <span className="w-1.5 h-1.5 rounded-full bg-paper-300" />}
                  </span>
                  <span>{label}{i === phaseAt && progress != null ? ` ${progress}%` : ''}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {step === 'preview' && (
          <>
            <p className="text-[12.5px] font-bold text-brand-deep">{source === 'meitav' ? t('preview.meitav') : t('preview.generic')}</p>
            <section className="mt-2 rounded-3xl bg-white border border-paper-200 shadow-card p-4 grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10.5px] font-black uppercase tracking-wide text-paper-muted">{t('preview.value')}</div>
                <div className="text-[22px] font-black text-ink-900 tabular-nums leading-tight">{formatMoney(totalUsd, 'USD', true)}</div>
              </div>
              <div>
                <div className="text-[10.5px] font-black uppercase tracking-wide text-paper-muted">{t('preview.day')}</div>
                <div className="text-[22px] font-black tabular-nums leading-tight" style={{ color: moveColor(dayTotal) }}>{dayTotal >= 0 ? '+' : ''}{formatMoney(dayTotal, 'USD', true)}</div>
              </div>
              <div>
                <div className="text-[10.5px] font-black uppercase tracking-wide text-paper-muted">{t('preview.assets')}</div>
                <div className="text-[16px] font-black text-ink-900 tabular-nums">{holdingsOut.length}</div>
              </div>
              <div>
                <div className="text-[10.5px] font-black uppercase tracking-wide text-paper-muted">{t('preview.cash')}</div>
                <div className="text-[16px] font-black text-ink-900 tabular-nums">{cashUsd != null ? formatMoney(cashUsd, 'USD', true) : '—'}</div>
              </div>
            </section>
            {fileCash.length > 0 && (
              <p className="mt-2 text-[12px] font-bold text-paper-muted leading-snug">
                {cashUsd != null ? t('preview.cashFound', { amount: formatMoney(cashUsd, 'USD') }) : t('preview.noCashRate')}
              </p>
            )}
            {rows.length === 0 && <p className="mt-4 text-[13px] font-bold text-ink-900">{t('preview.none')}</p>}
            {skipped > 0 && <p className="mt-2 text-[12px] font-bold text-[#b8860b]">{t('preview.skipped', { n: skipped })}</p>}

            <ul className="mt-3 space-y-2">
              {priced.map((x) => {
                const r = x.r;
                const warnings = warningsOf(x);
                const weight = totalUsd > 0 && x.usd != null ? (x.usd / totalUsd) * 100 : null;
                const sector = SECTOR_BY_ID[r.sector];
                const domain = BOARD_BY_SYMBOL[r.symbol]?.domain;
                const isEditing = editing === r.id;
                const cost = r.averagePrice != null ? (agorot && /\.TA$/i.test(r.symbol || '') ? r.averagePrice / 100 : r.averagePrice) : null;
                const plPct = cost && x.livePrice != null ? ((x.livePrice - cost) / cost) * 100 : null;
                return (
                  <li key={r.id} className={`rounded-3xl border bg-white px-3 py-2.5 ${r.removed ? 'opacity-50' : warnings.includes('unknown') ? 'border-[#e2706f]' : warnings.length ? 'border-[#f5c542]' : 'border-paper-200'}`}>
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 shrink-0 rounded-2xl bg-paper-100 grid place-items-center overflow-hidden text-[10px] font-black text-ink-900">
                        {domain ? <img src={`/api/logo?domain=${encodeURIComponent(domain)}`} alt="" className="w-6 h-6 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : (r.symbol || '?').replace(/\.(TA|L)$/, '').slice(0, 5)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13.5px] font-black text-ink-900 truncate">{loc(r.display) || r.name}</span>
                        <span dir="ltr" className="block text-[11px] text-paper-muted truncate text-start">{r.symbol || '—'}{sector ? ` · ${loc(sector.name)}` : ''} · {t('preview.shares', { n: (r.quantity ?? 0).toLocaleString() })}</span>
                      </span>
                      <span className="shrink-0 text-end">
                        <span className="block text-[13px] font-black tabular-nums text-ink-900">{x.usd != null ? formatMoney(x.usd, 'USD', true) : '—'}</span>
                        <span className="block text-[11px] font-bold tabular-nums text-paper-muted">
                          {weight != null ? `${weight.toFixed(1)}%` : ''}{x.dayPct != null ? <span style={{ color: moveColor(x.dayPct) }}> · {formatPct(x.dayPct)}</span> : null}
                        </span>
                      </span>
                    </div>
                    {plPct != null && !r.removed && (
                      <div className="mt-1 text-[11px] font-bold tabular-nums text-paper-muted">{t('preview.pl')}: <span style={{ color: moveColor(plPct) }}>{formatPct(plPct)}</span></div>
                    )}
                    {warnings.length > 0 && !r.removed && (
                      <ul className="mt-1.5 space-y-0.5">
                        {warnings.map((w) => (
                          <li key={w} className="text-[11.5px] font-bold text-[#b2423f]">{t(`preview.${w === 'unknown' ? 'unknown' : w}`)}</li>
                        ))}
                      </ul>
                    )}
                    {isEditing && (
                      <div className="grid grid-cols-3 gap-1.5 mt-2">
                        <label className="text-[10px] font-bold text-paper-muted">
                          {t('import.symbol')}
                          <input dir="ltr" value={r.symbol || ''} onChange={(e) => { const v = e.target.value.toUpperCase(); patch(r.id, { symbol: v, status: v ? 'guess' : 'missing' }); if (v) ensureQuote(v).then(() => bump((n) => n + 1)); }} className="mt-0.5 w-full h-9 rounded-lg border border-paper-200 px-2 text-[12px] font-black text-ink-900" />
                        </label>
                        <label className="text-[10px] font-bold text-paper-muted">
                          {t('import.qty')}
                          <input dir="ltr" type="number" inputMode="decimal" value={r.quantity ?? ''} onChange={(e) => patch(r.id, { quantity: Number(e.target.value) })} className="mt-0.5 w-full h-9 rounded-lg border border-paper-200 px-2 text-[12px] font-black text-ink-900 tabular-nums" />
                        </label>
                        <label className="text-[10px] font-bold text-paper-muted">
                          {t('import.cost')}
                          <input dir="ltr" type="number" inputMode="decimal" value={r.averagePrice ?? ''} onChange={(e) => patch(r.id, { averagePrice: e.target.value === '' ? null : Number(e.target.value) })} className="mt-0.5 w-full h-9 rounded-lg border border-paper-200 px-2 text-[12px] font-black text-ink-900 tabular-nums" />
                        </label>
                      </div>
                    )}
                    <div className="flex gap-1.5 mt-2">
                      <button type="button" onClick={() => setEditing(isEditing ? null : r.id)} className="h-9 px-3 rounded-xl bg-paper-50 border border-paper-200 text-[11.5px] font-bold text-ink-900 inline-flex items-center gap-1"><Pencil size={13} aria-hidden="true" />{isEditing ? t('learn.gotIt') : t('preview.edit')}</button>
                      <button type="button" onClick={() => patch(r.id, { removed: !r.removed })} className="h-9 px-3 rounded-xl bg-paper-50 border border-paper-200 text-[11.5px] font-bold text-ink-900 inline-flex items-center gap-1">
                        {r.removed ? <Undo2 size={13} aria-hidden="true" /> : <Trash2 size={13} aria-hidden="true" />}
                        {r.removed ? t('preview.restore') : t('preview.remove')}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            {rows.some((r) => /\.TA$/i.test(r.symbol || '')) && (
              <label className="flex items-center gap-2 mt-3 text-[12px] font-bold text-ink-900/80">
                <input type="checkbox" checked={agorot} onChange={(e) => setAgorot(e.target.checked)} className="accent-[#ff6b1a] w-4 h-4" />
                {t('import.agorot')}
              </label>
            )}

            {diff && (diff.added.length || diff.removed.length || diff.increased.length || diff.decreased.length) > 0 && (
              <section className="mt-4 rounded-3xl bg-white border border-paper-200 shadow-card p-4">
                <h2 className="text-[11px] font-black uppercase tracking-wide text-paper-muted">{t('preview.changes')}</h2>
                <dl className="mt-2 space-y-2 text-[12.5px]">
                  {[['added', diff.added], ['increased', diff.increased], ['decreased', diff.decreased], ['removed', diff.removed]].map(([k, list]) =>
                    list.length ? (
                      <div key={k}>
                        <dt className="font-black text-ink-900">{t(`preview.${k}`)} · {list.length}</dt>
                        <dd className="text-paper-muted leading-snug">
                          {list.map((x) => `${nameOf(x.symbol)} (${x.from != null ? t('preview.sharesFromTo', { from: x.from.toLocaleString(), to: x.to.toLocaleString() }) : t('preview.shares', { n: x.qty.toLocaleString() })})`).join(' · ')}
                        </dd>
                      </div>
                    ) : null
                  )}
                  {diff.unchanged.length > 0 && <div className="text-paper-muted">{t('preview.unchanged')} · {diff.unchanged.length}</div>}
                </dl>
              </section>
            )}

            <div className="sticky bottom-0 pt-3 pb-[env(safe-area-inset-bottom,0px)] bg-gradient-to-t from-paper-50 via-paper-50 to-transparent">
              <button type="button" onClick={() => build(holdingsOut, cashUsd)} disabled={!holdingsOut.length} className="w-full min-h-[52px] rounded-2xl bg-brand text-white font-black text-[16px] shadow-fab disabled:opacity-40 active:scale-[0.99] transition-transform">
                {holdings.length ? t('preview.update') : t('preview.go')} · {holdingsOut.length}
              </button>
            </div>
            <p className="text-[11px] text-paper-muted mt-3 leading-snug">{t('import.privacy')}</p>
          </>
        )}
      </div>
      <AnimatePresence>
        {step === 'build' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[56] bg-paper-50/80 backdrop-blur-sm pointer-events-none" aria-hidden="true" />
        )}
      </AnimatePresence>
    </div>
  );
}
