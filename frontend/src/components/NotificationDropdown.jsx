import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { notificationsApi } from '../services/endpoints';
import { useSocket } from '../context/SocketContext';

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef(null);
  const { latestNotification } = useSocket();

  const load = () => {
    notificationsApi.list({ limit: 10 }).then((res) => {
      setNotifications(res.data.data.notifications);
      setUnreadCount(res.data.data.unreadCount);
    });
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (latestNotification) load(); }, [latestNotification]);

  useEffect(() => {
    const onClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const markAllRead = async () => {
    await notificationsApi.markAllRead();
    load();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-coral)] px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-[var(--color-line)] bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-[var(--color-line)] px-4 py-3">
            <span className="font-display text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs font-medium text-[var(--color-navy)]">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-gray-400">You're all caught up.</p>
            )}
            {notifications.map((n) => (
              <Link
                key={n._id}
                to={n.link || '#'}
                onClick={async () => { await notificationsApi.markRead(n._id); setOpen(false); load(); }}
                className={`block border-b border-[var(--color-line)] px-4 py-3 text-sm last:border-0 hover:bg-gray-50 ${
                  !n.isRead ? 'bg-[var(--color-marigold)]/5' : ''
                }`}
              >
                <p className="text-[var(--color-ink)]">{n.message}</p>
                <p className="mt-1 text-xs text-gray-400">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
