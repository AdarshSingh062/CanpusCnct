import { useEffect, useState } from 'react';
import { Heart, MessageCircle, Share2, Flag, Trash2, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { postsApi } from '../services/endpoints';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Avatar from '../components/Avatar';
import { SkeletonList } from '../components/Loader';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import { ShaderBackground } from '../components/ui/plasma-shader';
import { MODULE_COLORS } from '../utils/moduleColors';

const CATEGORIES = ['Academic', 'Event', 'Achievement', 'Discussion', 'Announcement', 'General'];

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('recent');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [newPost, setNewPost] = useState({ content: '', category: 'General' });
  const [posting, setPosting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await postsApi.list({ category, sort, search, page, limit: 8 });
      setPosts(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [category, sort, page]); // eslint-disable-line

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newPost.content.trim()) return;
    setPosting(true);
    try {
      const formData = new FormData();
      formData.append('content', newPost.content);
      formData.append('category', newPost.category);
      const res = await postsApi.create(formData);
      setPosts((prev) => [res.data.data, ...prev]);
      setNewPost({ content: '', category: 'General' });
      toast.success('Post shared!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post');
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (id) => {
    setPosts((prev) => prev.map((p) => {
      if (p._id !== id) return p;
      const liked = p.likes.includes(user._id);
      return { ...p, likes: liked ? p.likes.filter((l) => l !== user._id) : [...p.likes, user._id] };
    }));
    await postsApi.like(id);
  };

  const handleDelete = async (id) => {
    await postsApi.remove(id);
    setPosts((prev) => prev.filter((p) => p._id !== id));
    toast.success('Post deleted');
  };

  return (
    <div className="relative isolate mx-auto max-w-2xl overflow-hidden rounded-3xl px-1 py-1">
      <ShaderBackground className="pointer-events-none absolute inset-0 h-full w-full opacity-25" />
      <div className="relative z-10 space-y-5">
        <div>
          <h1 className="font-display text-2xl font-semibold">Campus Feed</h1>
          <p className="text-sm text-gray-500">Share updates, achievements, and discussions with campus.</p>
        </div>

        <Card accentColor={MODULE_COLORS.feed}>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="flex gap-3">
              <Avatar user={user} />
              <Input
                textarea
                placeholder="What's happening on campus?"
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                className="flex-1"
              />
            </div>
            <div className="flex items-center justify-between">
              <Select value={newPost.category} onChange={(e) => setNewPost({ ...newPost, category: e.target.value })} className="w-40">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
              <Button type="submit" loading={posting} disabled={!newPost.content.trim()}>Post</Button>
            </div>
          </form>
        </Card>

        <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
          <Input placeholder="Search posts…" value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 min-w-[160px]" />
          <Select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="w-40">
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} className="w-36">
            <option value="recent">Recent</option>
            <option value="trending">Trending</option>
          </Select>
        </form>

        {loading ? (
          <SkeletonList count={4} />
        ) : posts.length === 0 ? (
          <EmptyState title="No posts yet" description="Try a different filter, or be the first to post." />
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} user={user} onLike={handleLike} onDelete={handleDelete} />
            ))}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}

function PostCard({ post, user, onLike, onDelete }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const liked = post.likes.includes(user._id);
  const isOwner = post.author?._id === user._id;

  const toggleComments = async () => {
    setShowComments((s) => !s);
    if (!showComments && comments.length === 0) {
      const res = await postsApi.comments(post._id);
      setComments(res.data.data);
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const res = await postsApi.comment(post._id, commentText);
    setComments((prev) => [...prev, res.data.data]);
    setCommentText('');
  };

  const share = async () => {
    await postsApi.share(post._id);
    toast.success('Shared to your profile');
  };

  const report = async () => {
    await postsApi.report(post._id, 'Inappropriate content');
    toast.success('Reported to moderators');
  };

  return (
    <Card accentColor={MODULE_COLORS.feed}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar user={post.author} />
          <div>
            <p className="text-sm font-semibold">{post.author?.name}</p>
            <p className="text-xs text-gray-400">
              {post.author?.role} · {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              {post.isEdited && ' · edited'}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{post.category}</span>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm text-[var(--color-ink)]">{post.content}</p>

      {post.images?.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {post.images.map((img, i) => <img key={i} src={img.url} className="rounded-lg object-cover" alt="" />)}
        </div>
      )}

      <div className="mt-4 flex items-center gap-5 border-t border-[var(--color-line)] pt-3 text-sm text-gray-500">
        <button onClick={() => onLike(post._id)} className={`flex items-center gap-1.5 hover:text-[var(--color-coral)] ${liked ? 'text-[var(--color-coral)]' : ''}`}>
          <Heart size={16} fill={liked ? 'currentColor' : 'none'} /> {post.likes.length}
        </button>
        <button onClick={toggleComments} className="flex items-center gap-1.5 hover:text-[var(--color-navy)]">
          <MessageCircle size={16} /> {post.commentCount}
        </button>
        <button onClick={share} className="flex items-center gap-1.5 hover:text-[var(--color-teal)]">
          <Share2 size={16} /> {post.shareCount}
        </button>
        <button onClick={report} className="ml-auto flex items-center gap-1 text-gray-400 hover:text-[var(--color-coral)]">
          <Flag size={14} />
        </button>
        {isOwner && (
          <button onClick={() => onDelete(post._id)} className="text-gray-400 hover:text-[var(--color-coral)]">
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {showComments && (
        <div className="mt-3 space-y-3 border-t border-[var(--color-line)] pt-3">
          {comments.map((c) => (
            <div key={c._id} className="flex items-start gap-2">
              <Avatar user={c.author} size={26} />
              <div className="flex-1 rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-xs font-semibold">{c.author?.name}</p>
                <p className="text-sm">{c.text}</p>
              </div>
            </div>
          ))}
          <form onSubmit={submitComment} className="flex gap-2">
            <Input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment…" className="flex-1" />
            <Button type="submit" size="sm"><Send size={14} /></Button>
          </form>
        </div>
      )}
    </Card>
  );
}
