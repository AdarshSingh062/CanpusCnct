export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--color-line)] bg-white/50 px-6 py-14 text-center">
      {Icon && <Icon size={32} className="text-gray-300" />}
      <h3 className="font-display text-base font-semibold text-[var(--color-ink)]">{title}</h3>
      {description && <p className="max-w-sm text-sm text-gray-500">{description}</p>}
      {action}
    </div>
  );
}
