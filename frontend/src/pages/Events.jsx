import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, MapPin, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { eventsApi } from '../services/endpoints';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Modal from '../components/Modal';
import { SkeletonList } from '../components/Loader';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import { ShaderBackground } from '../components/ui/plasma-shader';
import { MODULE_COLORS } from '../utils/moduleColors';

const CATEGORIES = ['Hackathon', 'Workshop', 'Seminar', 'Sports', 'Cultural', 'Technical', 'Club', 'Placement', 'Other'];

export default function Events() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const canCreate = ['faculty', 'clubadmin', 'superadmin'].includes(user.role);

  const load = async () => {
    setLoading(true);
    try {
      const res = await eventsApi.list({ category, search, upcoming: true, page, limit: 9 });
      setEvents(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [category, page]); // eslint-disable-line

  return (
    <div className="relative isolate overflow-hidden rounded-3xl px-1 py-1">
      <ShaderBackground className="pointer-events-none absolute inset-0 h-full w-full opacity-25" />
      <div className="relative z-10 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold">Campus Events</h1>
            <p className="text-sm text-gray-500">Discover and register for what's happening.</p>
          </div>
          {canCreate && <Button onClick={() => setShowCreate(true)}><Plus size={16} /> Create Event</Button>}
        </div>

        <div className="flex flex-wrap gap-2">
          <Input placeholder="Search events…" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} className="flex-1 min-w-[160px]" />
          <Select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="w-44">
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>

        {loading ? (
          <SkeletonList />
        ) : events.length === 0 ? (
          <EmptyState title="No upcoming events" description="Check back soon, or create one yourself." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => (
              <Link key={e._id} to={`/events/${e._id}`}>
                <Card accentColor={MODULE_COLORS.events} className="h-full hover:shadow-md transition-shadow">
                  <span className="text-xs font-medium uppercase text-gray-400">{e.category}</span>
                  <h3 className="mt-1 font-display font-semibold">{e.title}</h3>
                  <p className="mt-2 flex items-center gap-1 text-xs text-gray-500"><MapPin size={12} /> {e.venue}</p>
                  <p className="text-xs text-gray-500">{format(new Date(e.date), 'MMM d, yyyy')} · {e.time}</p>
                  <p className="mt-2 flex items-center gap-1 text-xs font-medium text-[var(--color-teal)]">
                    <Users size={12} /> {Math.max(e.capacity - e.registeredCount, 0)} seats left
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

        <CreateEventModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={(ev) => { setEvents((prev) => [ev, ...prev]); setShowCreate(false); }} />
      </div>
    </div>
  );
}

function CreateEventModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', category: 'Workshop', date: '', time: '', venue: '', capacity: 50 });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      const res = await eventsApi.create(formData);
      toast.success('Event created!');
      onCreated(res.data.data);
      setForm({ title: '', description: '', category: 'Workshop', date: '', time: '', venue: '', capacity: 50 });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create an Event">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Input label="Description" textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Input label="Capacity" type="number" min={1} required value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Date" type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Input label="Time" required placeholder="e.g. 2:00 PM" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
        </div>
        <Input label="Venue" required value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
        <Button type="submit" className="w-full" loading={submitting}>Create Event</Button>
      </form>
    </Modal>
  );
}
