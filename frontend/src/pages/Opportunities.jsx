import { useEffect, useState } from 'react';
import { Plus, Bookmark, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { opportunitiesApi } from '../services/endpoints';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Modal from '../components/Modal';
import { SkeletonList } from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { MODULE_COLORS } from '../utils/moduleColors';

const TYPES = ['Internship', 'Full-Time Job', 'Part-Time Job', 'Hackathon', 'Competition', 'Scholarship'];

export default function Opportunities() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const canPost = ['faculty', 'clubadmin', 'superadmin'].includes(user.role);

  const load = async () => {
    setLoading(true);
    try {
      const res = await opportunitiesApi.list({ type, limit: 15 });
      setItems(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [type]); // eslint-disable-line

  const handleBookmark = async (id) => {
    await opportunitiesApi.bookmark(id);
    toast.success('Saved to your bookmarks');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Internships & Jobs</h1>
          <p className="text-sm text-gray-500">Opportunities curated for your campus.</p>
        </div>
        {canPost && <Button onClick={() => setShowCreate(true)}><Plus size={16} /> Post Opportunity</Button>}
      </div>

      <Select value={type} onChange={(e) => setType(e.target.value)} className="w-48">
        <option value="">All types</option>
        {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
      </Select>

      {loading ? (
        <SkeletonList />
      ) : items.length === 0 ? (
        <EmptyState title="No opportunities posted yet" />
      ) : (
        <div className="space-y-3">
          {items.map((o) => (
            <Card key={o._id} accentColor={MODULE_COLORS.opportunities}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display font-semibold">{o.title}</p>
                  <p className="text-sm text-gray-500">{o.company} · {o.type} · {o.location}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-gray-600">{o.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {o.skillsRequired?.map((s) => <span key={s} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{s}</span>)}
                  </div>
                  {o.deadline && <p className="mt-2 text-xs text-[var(--color-coral)]">Apply by {format(new Date(o.deadline), 'MMM d, yyyy')}</p>}
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  <a href={o.applyLink} target="_blank" rel="noreferrer">
                    <Button size="sm"><ExternalLink size={14} /> Apply</Button>
                  </a>
                  <Button size="sm" variant="outline" onClick={() => handleBookmark(o._id)}><Bookmark size={14} /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateOpportunityModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={(o) => { setItems((prev) => [o, ...prev]); setShowCreate(false); }} />
    </div>
  );
}

function CreateOpportunityModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', company: '', type: 'Internship', description: '', skillsRequired: '', location: 'Remote', applyLink: '', deadline: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await opportunitiesApi.create(form);
      toast.success('Opportunity posted!');
      onCreated(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Post an Opportunity">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Input label="Company" required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
        <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
        <Input label="Description" textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <Input label="Skills (comma-separated)" value={form.skillsRequired} onChange={(e) => setForm({ ...form, skillsRequired: e.target.value })} />
        <Input label="Apply Link" required value={form.applyLink} onChange={(e) => setForm({ ...form, applyLink: e.target.value })} />
        <Input label="Deadline" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
        <Button type="submit" className="w-full" loading={submitting}>Post Opportunity</Button>
      </form>
    </Modal>
  );
}
