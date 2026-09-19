export default function Select({ label, children, className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm font-medium text-[var(--color-ink)]">{label}</span>}
      <select
        className={`w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] focus:border-[var(--color-navy)] focus:outline-none ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
