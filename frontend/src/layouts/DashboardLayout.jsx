import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Menu, LogOut } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import NotificationDropdown from '../components/NotificationDropdown';
import GlobalSearch from '../components/GlobalSearch';
import Avatar from '../components/Avatar';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex min-h-screen flex-1 flex-col lg:pl-0">
        <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-[var(--color-line)] bg-white/80 px-4 py-3 backdrop-blur">
          <button className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>

          <div className="hidden flex-1 sm:block">
            <GlobalSearch />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <NotificationDropdown />
            <Link to="/profile" className="flex items-center gap-2">
              <Avatar user={user} size={32} />
              <span className="hidden text-sm font-medium sm:block">{user?.name}</span>
            </Link>
            <button onClick={logout} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-[var(--color-coral)]" aria-label="Log out">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
