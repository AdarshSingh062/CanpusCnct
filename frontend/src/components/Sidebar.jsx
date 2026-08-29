import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Newspaper, AlertTriangle, CalendarDays, Users2,
  ShoppingBag, Search as SearchIcon, BookOpen, Briefcase, MessageSquare, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MODULE_COLORS } from '../utils/moduleColors';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'var(--color-navy)' },
  { to: '/feed', label: 'Campus Feed', icon: Newspaper, color: MODULE_COLORS.feed },
  { to: '/complaints', label: 'Complaints', icon: AlertTriangle, color: MODULE_COLORS.complaints },
  { to: '/events', label: 'Events', icon: CalendarDays, color: MODULE_COLORS.events },
  { to: '/clubs', label: 'Clubs', icon: Users2, color: MODULE_COLORS.clubs },
  { to: '/lost-found', label: 'Lost & Found', icon: SearchIcon, color: MODULE_COLORS.lostfound },
  { to: '/marketplace', label: 'Marketplace', icon: ShoppingBag, color: MODULE_COLORS.marketplace },
  { to: '/resources', label: 'Notes & Resources', icon: BookOpen, color: MODULE_COLORS.resources },
  { to: '/opportunities', label: 'Opportunities', icon: Briefcase, color: MODULE_COLORS.opportunities },
  { to: '/chat', label: 'Messages', icon: MessageSquare, color: 'var(--color-navy)' },
];

export default function Sidebar({ mobileOpen, onClose }) {
  const { user } = useAuth();

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed z-40 flex h-screen w-64 flex-col bg-[var(--color-navy)] text-white transition-transform lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-marigold)] font-display text-sm font-bold text-[var(--color-ink)]">
            CC
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">CampusConnect</span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {NAV.map(({ to, label, icon: Icon, color }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
              <Icon size={17} />
              {label}
            </NavLink>
          ))}

          {user?.role === 'superadmin' && (
            <NavLink
              to="/admin"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <ShieldCheck size={17} />
              Admin Panel
            </NavLink>
          )}
        </nav>
      </aside>
    </>
  );
}
