import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { complaintsApi } from '../services/endpoints';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Select from '../components/Select';
import Input from '../components/Input';
import StatusPill from '../components/StatusPill';
import { Loader } from '../components/Loader';
import Avatar from '../components/Avatar';
import { ShaderBackground } from '../components/ui/plasma-shader';
import { MODULE_COLORS } from '../utils/moduleColors';

const STATUSES = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export default function ComplaintDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const isStaff = ['faculty', 'superadmin'].includes(user.role);

  const load = async () => {
    const res = await complaintsApi.get(id);
    setComplaint(res.data.data.complaint);
    setComments(res.data.data.comments);
  };

  useEffect(() => { load(); }, [id]); // eslint-disable-line

  const updateStatus = async (status) => {
    await complaintsApi.updateStatus(id, { status });
    toast.success(`Status updated to ${status}`);
    load();
  };

  const overridePriority = async (priority) => {
    await complaintsApi.overridePriority(id, priority);
    toast.success(`Priority overridden to ${priority}`);
    load();
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const res = await complaintsApi.comment(id, commentText);
    setComments((prev) => [...prev, res.data.data]);
    setCommentText('');
  };

  if (!complaint) return <Loader />;

  return (
    <div className="relative isolate mx-auto max-w-3xl overflow-hidden rounded-3xl px-1 py-1">
      <ShaderBackground className="pointer-events-none absolute inset-0 h-full w-full opacity-25" />
      <div className="relative z-10 space-y-5">
        <Link to="/complaints" className="flex items-center gap-1 text-sm text-gray-500 hover:text-[var(--color-navy)]">
          <ArrowLeft size={14} /> Back to complaints
        </Link>

      <Card accentColor={MODULE_COLORS.complaints}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-semibold">{complaint.title}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {complaint.category} · filed by {complaint.createdBy?.name} on {format(new Date(complaint.createdAt), 'MMM d, yyyy')}
            </p>
          </div>
          <div className="flex gap-2">
            <StatusPill status={complaint.priority} />
            <StatusPill status={complaint.status} />
          </div>
        </div>

        <p className="mt-4 text-sm text-[var(--color-ink)]">{complaint.description}</p>

        {complaint.images?.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {complaint.images.map((img, i) => <img key={i} src={img.url} className="rounded-lg" alt="" />)}
          </div>
        )}

        {isStaff && (
          <div className="mt-4 flex flex-wrap gap-3 border-t border-[var(--color-line)] pt-4">
            <Select value={complaint.status} onChange={(e) => updateStatus(e.target.value)} className="w-48">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Select value={complaint.priority} onChange={(e) => overridePriority(e.target.value)} className="w-40">
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
            {complaint.priorityOverridden && <span className="self-center text-xs text-gray-400">(manually overridden)</span>}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="mb-3 font-display text-sm font-semibold">Status Timeline</h3>
        <ol className="space-y-4 border-l-2 border-[var(--color-line)] pl-4">
          {complaint.statusHistory.map((h, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[21px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-[var(--color-teal)]">
                <CheckCircle2 size={12} className="text-white" />
              </span>
              <p className="text-sm font-medium">{h.status}</p>
              <p className="text-xs text-gray-400">
                {h.changedBy?.name || 'System'} · {format(new Date(h.changedAt), 'MMM d, h:mm a')}
              </p>
              {h.note && <p className="mt-0.5 text-sm text-gray-600">{h.note}</p>}
            </li>
          ))}
        </ol>
      </Card>

        <Card>
          <h3 className="mb-3 font-display text-sm font-semibold">Discussion</h3>
          <div className="space-y-3">
            {comments.map((c) => (
              <div key={c._id} className="flex items-start gap-2">
                <Avatar user={c.author} size={28} />
                <div className={`flex-1 rounded-lg px-3 py-2 ${c.isStaffReply ? 'bg-[var(--color-navy)]/5' : 'bg-gray-50'}`}>
                  <p className="text-xs font-semibold">{c.author?.name} {c.isStaffReply && <span className="text-[var(--color-navy)]">(Staff)</span>}</p>
                  <p className="text-sm">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={submitComment} className="mt-3 flex gap-2">
            <Input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a comment…" className="flex-1" />
            <Button type="submit">Send</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
