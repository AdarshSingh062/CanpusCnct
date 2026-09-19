import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { lostFoundApi } from '../services/endpoints';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Modal from '../components/Modal';
import StatusPill from '../components/StatusPill';
import { SkeletonList } from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { MODULE_COLORS } from '../utils/moduleColors';
import { format } from 'date-fns';

export default function LostFound() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await lostFoundApi.list({ type, limit: 20 });
      setItems(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [type]); // eslint-disable-line

  const handleClaim = async (id) => {
    await lostFoundApi.claim(id);
    toast.success('Marked as claimed — coordinate with the poster');
    load();
  };

  const handleMarkFound = async (id) => {
    await lostFoundApi.markFound(id);
    toast.success('Marked as found');
    load();
  };

  const handleResolve = async (id) => {
    await lostFoundApi.resolve(id);
    toast.success('Marked resolved');
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Lost & Found</h1>
          <p className="text-sm text-gray-500">Help reunite items with their owners.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus size={16} /> Post an Item</Button>
      </div>

      <div className="flex gap-2">
        {['', 'Lost', 'Found'].map((t) => (
          <button key={t} onClick={() => setType(t)} className={`rounded-full px-4 py-1.5 text-sm font-medium ${type === t ? 'bg-[var(--color-navy)] text-white' : 'bg-white text-gray-500 border border-[var(--color-line)]'}`}>
            {t || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonList />
      ) : items.length === 0 ? (
        <EmptyState title="No items posted" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const isOwner = item.createdBy?._id === user._id;
            return (
              <Card key={item._id} accentColor={MODULE_COLORS.lostfound}>
                {item.images?.[0] && <img src={item.images[0].url} className="mb-2 h-28 w-full rounded-lg object-cover" alt="" />}
                <div className="flex items-start justify-between">
                  <p className="font-display font-semibold">{item.title}</p>
                  <StatusPill status={item.status} />
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-gray-600">{item.description}</p>
                <p className="mt-1 text-xs text-gray-400">{item.category} · {format(new Date(item.date), 'MMM d')}</p>
                <div className="mt-3 flex gap-2">
                  {isOwner && item.type === 'Lost' && item.status === 'Lost' && (
                    <Button size="sm" variant="outline" onClick={() => handleMarkFound(item._id)}>Mark Found</Button>
                  )}
                  {!isOwner && ['Lost', 'Found'].includes(item.status) && (
                    <Button size="sm" variant="outline" onClick={() => handleClaim(item._id)}>This is Mine</Button>
                  )}
                  {isOwner && item.status === 'Claimed' && (
                    <Button size="sm" onClick={() => handleResolve(item._id)}>Mark Resolved</Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <CreatePostModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={(i) => { setItems((prev) => [i, ...prev]); setShowCreate(false); }} />
    </div>
  );
}

function CreatePostModal({ open, onClose, onCreated }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ type: 'Lost', title: '', description: '', category: 'Personal Items', date: '', contactInfo: user.email });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      const res = await lostFoundApi.create(formData);
      toast.success(`${form.type} item posted`);
      onCreated(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Post an Item">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="Lost">Lost</option>
          <option value="Found">Found</option>
        </Select>
        <Input label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Input label="Description" textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <Input label="Category" required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        <Input label="Date" type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <Input label="Contact info" required value={form.contactInfo} onChange={(e) => setForm({ ...form, contactInfo: e.target.value })} />
        <Button type="submit" className="w-full" loading={submitting}>Post</Button>
      </form>
    </Modal>
  );
}
