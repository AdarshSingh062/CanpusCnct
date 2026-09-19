import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import { complaintsApi } from '../services/endpoints';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Modal from '../components/Modal';
import StatusPill from '../components/StatusPill';
import { SkeletonList } from '../components/Loader';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import { ShaderBackground } from '../components/ui/plasma-shader';
import { MODULE_COLORS } from '../utils/moduleColors';
import { formatDistanceToNow } from 'date-fns';

const CATEGORIES = ['Hostel', 'Mess', 'Electricity', 'Water', 'Wi-Fi', 'Classroom', 'Library', 'Cleanliness', 'Security', 'Other'];
const STATUSES = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed'];

export default function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await complaintsApi.list({ status, category, page, limit: 8 });
      setComplaints(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [status, category, page]); // eslint-disable-line

  return (
    <div className="relative isolate overflow-hidden rounded-3xl px-1 py-1">
      <ShaderBackground className="pointer-events-none absolute inset-0 h-full w-full opacity-25" />
      <div className="relative z-10 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold">Campus Complaints</h1>
            <p className="text-sm text-gray-500">Report issues and track their resolution.</p>
          </div>
          <Button onClick={() => setShowCreate(true)}><Plus size={16} /> New Complaint</Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-44">
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="w-44">
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>

        {loading ? (
          <SkeletonList />
        ) : complaints.length === 0 ? (
          <EmptyState title="No complaints found" description="Nothing matches these filters yet." />
        ) : (
          <div className="space-y-3">
            {complaints.map((c) => (
              <Link key={c._id} to={`/complaints/${c._id}`}>
                <Card accentColor={MODULE_COLORS.complaints} className="hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{c.title}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {c.category} · filed by {c.createdBy?.name} · {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <StatusPill status={c.priority} />
                      <StatusPill status={c.status} />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

        <CreateComplaintModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          onCreated={(c) => { setComplaints((prev) => [c, ...prev]); setShowCreate(false); }}
        />
      </div>
    </div>
  );
}

function CreateComplaintModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', category: 'Other', severity: 'medium', affectedCount: 1 });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      const res = await complaintsApi.create(formData);
      toast.success(`Complaint submitted — priority: ${res.data.data.priority}`);
      onCreated(res.data.data);
      setForm({ title: '', description: '', category: 'Other', severity: 'medium', affectedCount: 1 });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Report a Campus Issue">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Wi-Fi down in Hostel Block C" />
        <Input label="Description" textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select label="Severity" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </Select>
        </div>
        <Input label="Approx. people affected" type="number" min={1} value={form.affectedCount} onChange={(e) => setForm({ ...form, affectedCount: e.target.value })} />
        <p className="text-xs text-gray-400">Priority is calculated automatically from category, severity, and scale — staff can override it later.</p>
        <Button type="submit" className="w-full" loading={submitting}>Submit Complaint</Button>
      </form>
    </Modal>
  );
}
