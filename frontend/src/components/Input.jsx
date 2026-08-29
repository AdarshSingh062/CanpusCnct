export default function Input({ label, error, className = '', textarea = false, ...props }) {
  const Comp = textarea ? 'textarea' : 'input';
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm font-medium text-[var(--color-ink)]">{label}</span>}
      <Comp
        className={`w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-gray-400 focus:border-[var(--color-navy)] focus:outline-none ${
          textarea ? 'min-h-[100px] resize-y' : ''
        } ${className}`}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-[var(--color-coral)]">{error}</span>}
    </label>
  );
}
