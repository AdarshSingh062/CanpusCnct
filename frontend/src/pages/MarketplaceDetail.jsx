import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { marketplaceApi } from '../services/endpoints';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import StatusPill from '../components/StatusPill';
import { Loader } from '../components/Loader';
import { MODULE_COLORS } from '../utils/moduleColors';

export default function MarketplaceDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);

  useEffect(() => { marketplaceApi.get(id).then((res) => setItem(res.data.data)); }, [id]);

  const handleContact = async () => {
    try {
      const res = await marketplaceApi.contact(id);
      navigate('/chat', { state: { conversationId: res.data.data._id } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start chat');
    }
  };

  if (!item) return <Loader />;
  const isSeller = item.seller._id === user._id;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link to="/marketplace" className="flex items-center gap-1 text-sm text-gray-500 hover:text-[var(--color-navy)]">
        <ArrowLeft size={14} /> Back to marketplace
      </Link>

      <Card accentColor={MODULE_COLORS.marketplace}>
        {item.images?.length > 0 && (
          <div className="mb-4 grid grid-cols-2 gap-2">
            {item.images.map((img, i) => <img key={i} src={img.url} className="rounded-lg object-cover" alt="" />)}
          </div>
        )}
        <div className="flex items-start justify-between">
          <h1 className="font-display text-xl font-semibold">{item.title}</h1>
          <StatusPill status={item.status} />
        </div>
        <p className="mt-1 text-2xl font-semibold text-[var(--color-marigold-dark)]">₹{item.price}</p>
        <p className="mt-3 text-sm text-gray-600">{item.description}</p>
        <p className="mt-3 text-xs text-gray-400">{item.category} · {item.condition} · Sold by {item.seller.name}</p>

        {!isSeller && item.status === 'Available' && (
          <Button className="mt-4" onClick={handleContact}><MessageSquare size={16} /> Contact Seller</Button>
        )}
        {isSeller && <p className="mt-4 text-sm text-gray-400">This is your listing.</p>}
      </Card>
    </div>
  );
}
