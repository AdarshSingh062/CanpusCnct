import { STATUS_COLORS } from '../utils/moduleColors';

export default function StatusPill({ status, className = '' }) {
  const color = STATUS_COLORS[status] || '#64748b';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
      style={{ backgroundColor: `${color}1a`, color }}
    >
      {status}
    </span>
  );
}
