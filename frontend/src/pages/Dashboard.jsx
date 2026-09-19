import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, AlertTriangle, Search as SearchIcon, Briefcase, Newspaper, Plus } from 'lucide-react';
import { dashboardApi } from '../services/endpoints';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import StatusPill from '../components/StatusPill';
import { Loader } from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { ShaderBackground } from '../components/ui/plasma-shader';
import { MODULE_COLORS } from '../utils/moduleColors';
import { format } from 'date-fns';

const QUICK_ACTIONS = [
  { label: 'Create Post', to: '/feed', color: MODULE_COLORS.feed },
  { label: 'Report Issue', to: '/complaints', color: MODULE_COLORS.complaints },
  { label: 'Upload Notes', to: '/resources', color: MODULE_COLORS.resources },
  { label: 'Create Lost Item', to: '/lost-found', color: MODULE_COLORS.lostfound },
  { label: 'Sell Item', to: '/marketplace', color: MODULE_COLORS.marketplace },
  { label: 'Find Event', to: '/events', color: MODULE_COLORS.events },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    dashboardApi.get().then((res) => setData(res.data.data));
  }, []);

  if (!data) return <Loader label="Loading your dashboard…" />;

  return (
    <div className="relative isolate overflow-hidden rounded-3xl px-1 py-1">
      <ShaderBackground className="pointer-events-none absolute inset-0 h-full w-full opacity-25" />
      <div className="relative z-10 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">Welcome, {user?.name?.split(' ')[0]}</h1>
          <p className="text-sm text-gray-500">Here's what's happening across campus today.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.label}
              to={a.to}
              className="flex flex-col items-center gap-2 rounded-xl border border-[var(--color-line)] bg-white p-4 text-center text-sm font-medium hover:shadow-md transition-shadow"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: `${a.color}1a`, color: a.color }}>
                <Plus size={16} />
              </span>
              {a.label}
            </Link>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
        <Card accentColor={MODULE_COLORS.events} className="lg:col-span-1">
          <SectionHeader icon={CalendarDays} title="Upcoming Events" to="/events" />
          {data.upcomingEvents.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">No upcoming events.</p>
          ) : (
            <ul className="space-y-3">
              {data.upcomingEvents.map((e) => (
                <li key={e._id}>
                  <Link to={`/events/${e._id}`} className="block rounded-lg p-2 hover:bg-gray-50">
                    <p className="text-sm font-medium">{e.title}</p>
                    <p className="text-xs text-gray-500">{format(new Date(e.date), 'MMM d, yyyy')} · {e.venue}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card accentColor={MODULE_COLORS.complaints}>
          <SectionHeader icon={AlertTriangle} title="My Complaints" to="/complaints" />
          {data.myComplaints.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">No complaints filed.</p>
          ) : (
            <ul className="space-y-3">
              {data.myComplaints.map((c) => (
                <li key={c._id}>
                  <Link to={`/complaints/${c._id}`} className="flex items-center justify-between rounded-lg p-2 hover:bg-gray-50">
                    <span className="truncate text-sm font-medium">{c.title}</span>
                    <StatusPill status={c.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card accentColor={MODULE_COLORS.lostfound}>
          <SectionHeader icon={SearchIcon} title="Lost & Found" to="/lost-found" />
          {data.lostFound.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">No recent items.</p>
          ) : (
            <ul className="space-y-3">
              {data.lostFound.map((item) => (
                <li key={item._id} className="flex items-center justify-between rounded-lg p-2">
                  <span className="truncate text-sm font-medium">{item.title}</span>
                  <StatusPill status={item.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card accentColor={MODULE_COLORS.clubs}>
          <SectionHeader icon={Newspaper} title="Recommended Clubs" to="/clubs" />
          {data.recommendedClubs.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">No clubs yet.</p>
          ) : (
            <ul className="space-y-3">
              {data.recommendedClubs.map((c) => (
                <li key={c._id}>
                  <Link to={`/clubs/${c._id}`} className="block rounded-lg p-2 hover:bg-gray-50">
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.memberCount} members</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card accentColor={MODULE_COLORS.opportunities}>
          <SectionHeader icon={Briefcase} title="Latest Opportunities" to="/opportunities" />
          {data.latestOpportunities.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">Nothing posted yet.</p>
          ) : (
            <ul className="space-y-3">
              {data.latestOpportunities.map((o) => (
                <li key={o._id}>
                  <p className="text-sm font-medium">{o.title}</p>
                  <p className="text-xs text-gray-500">{o.company} · {o.type}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card accentColor={MODULE_COLORS.feed}>
          <SectionHeader icon={Newspaper} title="Recent Posts" to="/feed" />
          {data.recentPosts.length === 0 ? (
            <EmptyState title="No posts yet" description="Be the first to share something with campus." />
          ) : (
            <ul className="space-y-3">
              {data.recentPosts.map((p) => (
                <li key={p._id} className="rounded-lg p-2">
                  <p className="text-sm font-medium">{p.author?.name}</p>
                  <p className="line-clamp-2 text-xs text-gray-500">{p.content}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, to }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h3 className="flex items-center gap-2 font-display text-sm font-semibold">
        <Icon size={16} /> {title}
      </h3>
      <Link to={to} className="text-xs font-medium text-[var(--color-navy)] hover:underline">View all</Link>
    </div>
  );
}
