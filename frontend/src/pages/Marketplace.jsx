import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { marketplaceApi } from '../services/endpoints';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Modal from '../components/Modal';
import StatusPill from '../components/StatusPill';
import { SkeletonList } from '../components/Loader';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import { MODULE_COLORS } from '../utils/moduleColors';

const CATEGORIES = ['Books', 'Electronics', 'Furniture', 'Cycles', 'College Supplies', 'Other'];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Worn'];

export default function Marketplace() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await marketplaceApi.list({ category, search, page, limit: 9 });
      setItems(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [category, page]); // eslint-disable-line

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Student Marketplace</h1>
          <p className="text-sm text-gray-500">Buy and sell within campus.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus size={16} /> Sell an Item</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input placeholder="Search listings…" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} className="flex-1 min-w-[160px]" />
        <Select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="w-44">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
      </div>

      {loading ? (
        <SkeletonList />
      ) : items.length === 0 ? (
        <EmptyState title="No listings found" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link key={item._id} to={`/marketplace/${item._id}`}>
              <Card accentColor={MODULE_COLORS.marketplace} className="h-full hover:shadow-md transition-shadow">
                {item.images?.[0] && <img src={item.images[0].url} className="mb-2 h-32 w-full rounded-lg object-cover" alt="" />}
                <div className="flex items-start justify-between">
                  <p className="font-display font-semibold">{item.title}</p>
                  <StatusPill status={item.status} />
                </div>
                <p className="mt-1 text-lg font-semibold text-[var(--color-marigold-dark)]">₹{item.price}</p>
                <p className="text-xs text-gray-400">{item.category} · {item.condition}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <CreateListingModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={(i) => { setItems((prev) => [i, ...prev]); setShowCreate(false); }} />
    </div>
  );
}

function CreateListingModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', price: '', category: 'Books', condition: 'Good' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      const res = await marketplaceApi.create(formData);
      toast.success('Listed for sale!');
      onCreated(res.data.data);
      setForm({ title: '', description: '', price: '', category: 'Books', condition: 'Good' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to list item');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Sell an Item">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Input label="Description" textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Price (₹)" type="number" min={0} required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <Select label="Condition" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
            {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
        <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Button type="submit" className="w-full" loading={submitting}>List Item</Button>
      </form>
    </Modal>
  );
}
