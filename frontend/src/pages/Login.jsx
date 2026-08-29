import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold">Welcome back</h2>
      <p className="mt-1 text-sm text-gray-500">Log in to your CampusConnect account.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Input
          label="Email"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="you@college.edu"
        />
        <Input
          label="Password"
          type="password"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="••••••••"
        />
        {error && <p className="text-sm text-[var(--color-coral)]">{error}</p>}
        <div className="flex items-center justify-between text-sm">
          <Link to="/forgot-password" className="text-[var(--color-navy)] hover:underline">Forgot password?</Link>
        </div>
        <Button type="submit" className="w-full" loading={loading}>Log in</Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Don't have an account?{' '}
        <Link to="/register" className="font-medium text-[var(--color-navy)] hover:underline">Sign up</Link>
      </p>

      <div className="mt-8 rounded-lg border border-dashed border-[var(--color-line)] bg-white p-3 text-xs text-gray-500">
        <p className="mb-1 font-medium text-gray-700">Demo accounts (password: Password123!)</p>
        <p>student@campusconnect.demo · faculty@campusconnect.demo</p>
        <p>clubadmin@campusconnect.demo · admin@campusconnect.demo</p>
      </div>
    </div>
  );
}
