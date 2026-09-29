const VARIANTS = {
  primary: 'bg-primary text-surface hover:bg-primary/85 active:scale-[0.98]',
  ghost: 'bg-surface-bright text-text hover:bg-surface-bright/70 active:scale-[0.98]',
  outline: 'border border-border text-text-2 hover:text-text hover:border-primary',
  up: 'bg-primary text-surface hover:bg-primary/85 active:scale-[0.98]',
  down: 'bg-secondary text-surface hover:bg-secondary/85 active:scale-[0.98]',
  gold: 'bg-gold text-surface hover:bg-gold/85 active:scale-[0.98]',
  // for content on a white sheet
  brand: 'bg-brand text-white hover:bg-brand-soft active:scale-[0.98] shadow-fab',
  paper: 'bg-paper-100 text-ink-900 hover:bg-paper-200 active:scale-[0.98]',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-7 py-3.5 text-lg',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) {
  return (
    <button
      type="button"
      className={`rounded-xl font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
