export default function Card({ children, className = '', accentColor, as: Comp = 'div', ...props }) {
  return (
    <Comp
      className={`rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-sm ${className}`}
      style={accentColor ? { borderLeft: `4px solid ${accentColor}` } : undefined}
      {...props}
    >
      {children}
    </Comp>
  );
}
