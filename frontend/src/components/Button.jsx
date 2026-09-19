const variants = {
  primary: 'bg-[var(--color-navy)] text-white hover:bg-[var(--color-navy-light)]',
  accent: 'bg-[var(--color-marigold)] text-[var(--color-ink)] hover:bg-[var(--color-marigold-dark)] hover:text-white',
  ghost: 'bg-transparent text-[var(--color-navy)] hover:bg-[var(--color-line)]',
  danger: 'bg-[var(--color-coral)] text-white hover:opacity-90',
  outline: 'bg-transparent border border-[var(--color-line)] text-[var(--color-ink)] hover:border-[var(--color-navy)]',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled = false,
  children,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}
