import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Newspaper,
  AlertTriangle,
  CalendarDays,
  Users2,
  ShoppingBag,
  Search as SearchIcon,
  BookOpen,
  Briefcase,
  MessageSquare,
  ShieldCheck,
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
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          z-40
          flex
          w-64
          shrink-0
          flex-col
          bg-slate-950/80
          text-white
          border-r
          border-white/10
          shadow-[0_20px_60px_rgba(2,6,23,0.65)]
          backdrop-blur-xl

          /* Mobile only */
          fixed
          left-0
          top-0
          h-screen
          transition-transform
          duration-300
          ease-in-out

          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}

          /* Desktop */
          lg:relative
          lg:left-auto
          lg:top-auto
          lg:h-auto
          lg:min-h-full
          lg:translate-x-0
        `}
      >

        {/* LOGO */}
        <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f5a623] font-display text-sm font-bold text-[#0f172a] shadow-[0_10px_30px_rgba(245,166,35,0.35)]">
            CC
          </div>

          <span className="font-display text-lg font-semibold tracking-tight text-white">
            CampusConnect
          </span>
        </div>

        {/* NAVIGATION */}
        <nav className="flex flex-col space-y-1 px-3 pb-4 pt-4">

          {NAV.map(({ to, label, icon: Icon, color }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
              />

              <Icon size={17} />

              <span>{label}</span>
            </NavLink>
          ))}

          {/* ADMIN */}
          {user?.role === 'superadmin' && (
            <NavLink
              to="/admin"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <ShieldCheck size={17} />
              <span>Admin Panel</span>
            </NavLink>
          )}

        </nav>

      </aside>
    </>
  );
}