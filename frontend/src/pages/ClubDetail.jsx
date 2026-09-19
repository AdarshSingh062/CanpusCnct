import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Megaphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { clubsApi } from '../services/endpoints';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import Avatar from '../components/Avatar';
import { Loader } from '../components/Loader';
import { MODULE_COLORS } from '../utils/moduleColors';
import { format } from 'date-fns';

export default function ClubDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [showAnnounce, setShowAnnounce] = useState(false);

  const load = () => clubsApi.get(id).then((res) => setData(res.data.data));
  useEffect(() => { load(); }, [id]); // eslint-disable-line

  if (!data) return <Loader />;
  const { club, members } = data;
  const isClubAdmin = club.admins.some((a) => a._id === user._id) || user.role === 'superadmin';

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link to="/clubs" className="flex items-center gap-1 text-sm text-gray-500 hover:text-[var(--color-navy)]">
        <ArrowLeft size={14} /> Back to clubs
      </Link>

      <Card accentColor={MODULE_COLORS.clubs}>
        <div className="flex items-center gap-4">
          {club.logo?.url ? (
            <img src={club.logo.url} className="h-16 w-16 rounded-xl object-cover" alt="" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[var(--color-teal)]/10 text-2xl font-bold text-[var(--color-teal)]">
              {club.name[0]}
            </div>
          )}
          <div>
            <h1 className="font-display text-xl font-semibold">{club.name}</h1>
            <p className="text-sm text-gray-500">{club.memberCount} members · {club.category}</p>
            {club.facultyCoordinator && <p className="text-xs text-gray-400">Coordinator: {club.facultyCoordinator.name}</p>}
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-600">{club.description}</p>
        {isClubAdmin && (
          <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowAnnounce(true)}>
            <Megaphone size={14} /> Publish Announcement
          </Button>
        )}
      </Card>

      <Card>
        <h3 className="mb-3 font-display text-sm font-semibold">Announcements</h3>
        {club.announcements.length === 0 ? (
          <p className="text-sm text-gray-400">No announcements yet.</p>
        ) : (
          <div className="space-y-3">
            {club.announcements.map((a, i) => (
              <div key={i} className="rounded-lg bg-gray-50 p-3">
                <p className="text-sm font-semibold">{a.title}</p>
                <p className="mt-1 text-sm text-gray-600">{a.body}</p>
                <p className="mt-1 text-xs text-gray-400">{format(new Date(a.createdAt), 'MMM d, yyyy')}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="mb-3 font-display text-sm font-semibold">Members ({members.length})</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {members.map((m) => (
            <div key={m._id} className="flex items-center gap-2">
              <Avatar user={m.user} size={30} />
              <span className="truncate text-sm">{m.user.name}</span>
            </div>
          ))}
        </div>
      </Card>

      <AnnounceModal open={showAnnounce} onClose={() => setShowAnnounce(false)} clubId={id} onDone={load} />
    </div>
  );
}

function AnnounceModal({ open, onClose, clubId, onDone }) {
  const [form, setForm] = useState({ title: '', body: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await clubsApi.announce(clubId, form);
      toast.success('Announcement published');
      setForm({ title: '', body: '' });
      onDone();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Publish Announcement">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Input label="Message" textarea required value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
        <Button type="submit" className="w-full" loading={submitting}>Publish</Button>
      </form>
    </Modal>
  );
}
