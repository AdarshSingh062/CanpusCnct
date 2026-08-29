import { useEffect, useState } from 'react';
import { Plus, Download, Star, Bookmark } from 'lucide-react';
import toast from 'react-hot-toast';
import { resourcesApi } from '../services/endpoints';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Modal from '../components/Modal';
import { SkeletonList } from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { MODULE_COLORS } from '../utils/moduleColors';

export default function Resources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('recent');
  const [search, setSearch] = useState('');
  const [showUpload, setShowUpload] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await resourcesApi.list({ sort, search, limit: 15 });
      setResources(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [sort]); // eslint-disable-line

  const handleDownload = async (id) => {
    const res = await resourcesApi.download(id);
    window.open(res.data.data.url, '_blank');
    load();
  };

  const handleRate = async (id, value) => {
    await resourcesApi.rate(id, value);
    toast.success('Thanks for rating!');
    load();
  };

  const handleBookmark = async (id) => {
    await resourcesApi.bookmark(id);
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Notes & Resources</h1>
          <p className="text-sm text-gray-500">Share and find academic materials.</p>
        </div>
        <Button onClick={() => setShowUpload(true)}><Plus size={16} /> Upload Resource</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input placeholder="Search by subject, title, tags…" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} className="flex-1 min-w-[160px]" />
        <Select value={sort} onChange={(e) => setSort(e.target.value)} className="w-40">
          <option value="recent">Most Recent</option>
          <option value="downloads">Most Downloaded</option>
          <option value="rating">Top Rated</option>
        </Select>
      </div>

      {loading ? (
        <SkeletonList />
      ) : resources.length === 0 ? (
        <EmptyState title="No resources yet" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((r) => (
            <Card key={r._id} accentColor={MODULE_COLORS.resources}>
              <p className="font-display font-semibold">{r.title}</p>
              <p className="text-xs text-gray-400">{r.subject} · Sem {r.semester} · {r.department}</p>
              <p className="mt-2 line-clamp-2 text-sm text-gray-600">{r.description}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {r.tags?.map((t) => <span key={t} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">#{t}</span>)}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1"><Download size={12} /> {r.downloads}</span>
                <span className="flex items-center gap-1"><Star size={12} className="text-[var(--color-marigold)]" /> {r.avgRating || '—'}</span>
                <button onClick={() => handleBookmark(r._id)}><Bookmark size={14} /></button>
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => handleDownload(r._id)}>Download</Button>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button key={v} onClick={() => handleRate(r._id, v)}>
                      <Star size={14} className="text-gray-300 hover:text-[var(--color-marigold)]" />
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <UploadModal open={showUpload} onClose={() => setShowUpload(false)} onCreated={(r) => { setResources((prev) => [r, ...prev]); setShowUpload(false); }} />
    </div>
  );
}

function UploadModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', subject: '', semester: 1, department: '', description: '', tags: '' });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please choose a file');
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      formData.append('file', file);
      const res = await resourcesApi.upload(formData);
      toast.success('Resource uploaded!');
      onCreated(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Upload a Resource">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Subject" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <Input label="Semester" type="number" min={1} max={12} value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} />
        </div>
        <Input label="Department" required value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
        <Input label="Description" textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <Input label="Tags (comma-separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
        <Input label="File (PDF/PPT/DOC)" type="file" required onChange={(e) => setFile(e.target.files[0])} />
        <Button type="submit" className="w-full" loading={submitting}>Upload</Button>
      </form>
    </Modal>
  );
}
