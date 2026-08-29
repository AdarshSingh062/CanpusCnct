import { useState } from 'react';
import toast from 'react-hot-toast';
import { authApi } from '../services/endpoints';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Avatar from '../components/Avatar';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user.name,
    bio: user.bio || '',
    department: user.department || '',
    semester: user.semester || '',
    rollNumber: user.rollNumber || '',
    skills: (user.skills || []).join(', '),
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authApi.updateProfile({ ...form, skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean) });
      updateUser(res.data.data);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div className="flex items-center gap-4">
        <Avatar user={user} size={64} />
        <div>
          <h1 className="font-display text-xl font-semibold">{user.name}</h1>
          <p className="text-sm text-gray-500 capitalize">{user.role} · {user.email}</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Bio" textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            <Input label="Semester" type="number" min={1} max={12} value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} />
          </div>
          <Input label="Roll Number" value={form.rollNumber} onChange={(e) => setForm({ ...form, rollNumber: e.target.value })} />
          <Input label="Skills (comma-separated)" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
          <Button type="submit" loading={saving}>Save Changes</Button>
        </form>
      </Card>
    </div>
  );
}
