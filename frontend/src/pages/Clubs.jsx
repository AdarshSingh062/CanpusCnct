import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { clubsApi } from '../services/endpoints';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import { SkeletonList } from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { MODULE_COLORS } from '../utils/moduleColors';

export default function Clubs() {
  const { user } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const canCreate = ['clubadmin', 'superadmin'].includes(user.role);

  const load = async () => {
    setLoading(true);
    try {
      const res = await clubsApi.list({ search });
      setClubs(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const handleJoin = async (id) => {
    try {
      await clubsApi.join(id);
      toast.success('Join request sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Clubs</h1>
          <p className="text-sm text-gray-500">Find your community on campus.</p>
        </div>
        {canCreate && <Button onClick={() => setShowCreate(true)}><Plus size={16} /> Create Club</Button>}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); load(); }}>
        <Input placeholder="Search clubs…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </form>

      {loading ? (
        <SkeletonList />
      ) : clubs.length === 0 ? (
        <EmptyState title="No clubs found" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((c) => (
            <Card key={c._id} accentColor={MODULE_COLORS.clubs} className="flex flex-col">
              <Link to={`/clubs/${c._id}`} className="flex-1">
                <div className="flex items-center gap-3">
                  {c.logo?.url ? (
                    <img src={c.logo.url} className="h-10 w-10 rounded-lg object-cover" alt="" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-teal)]/10 text-[var(--color-teal)]">
                      <Users2 size={18} />
                    </div>
                  )}
                  <div>
                    <p className="font-display font-semibold">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.memberCount} members</p>
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-gray-600">{c.description}</p>
              </Link>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => handleJoin(c._id)}>Request to Join</Button>
            </Card>
          ))}
        </div>
      )}

      <CreateClubModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={(c) => { setClubs((prev) => [c, ...prev]); setShowCreate(false); }} />
    </div>
  );
}

function CreateClubModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', category: 'General' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      const res = await clubsApi.create(formData);
      toast.success('Club created!');
      onCreated(res.data.data);
      setForm({ name: '', description: '', category: 'General' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create club');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create a Club">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input label="Club name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label="Description" textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        <Button type="submit" className="w-full" loading={submitting}>Create Club</Button>
      </form>
    </Modal>
  );
}
