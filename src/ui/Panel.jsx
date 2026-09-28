export function Panel({ className = '', children, ...props }) {
  return (
    <div
      className={`bg-surface-container border border-border/60 rounded-2xl ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function Stat({ label, value, tone = 'text' }) {
  return (
    <div className="text-center">
      <div className="text-[11px] text-text-3 font-semibold">{label}</div>
      <div className={`text-lg font-bold tabular-nums text-${tone}`}>{value}</div>
    </div>
  );
}

export default Panel;
