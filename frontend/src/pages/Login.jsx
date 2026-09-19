import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Input from '../components/Input';
import Button from '../components/Button';
import { ShaderBackground } from '../components/ui/plasma-shader';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shakeKey, setShakeKey] = useState(0); // bump this to re-trigger the shake animation

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
      setShakeKey((k) => k + 1); // re-trigger shake even if the error text is identical
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative isolate -mx-4 overflow-hidden rounded-3xl px-4 py-6 sm:-mx-6 sm:px-6">
      <ShaderBackground className="pointer-events-none absolute inset-0 h-full w-full opacity-75" />
      <div className="relative z-10 rounded-2xl bg-white/65 p-5 shadow-xl shadow-navy/10 backdrop-blur-sm">
        <h2
          className="font-display text-2xl font-semibold animate-fade-in-up"
          style={{ animationDelay: '40ms' }}
        >
          Welcome back
        </h2>
        <p
          className="mt-1 text-sm text-gray-500 animate-fade-in-up"
          style={{ animationDelay: '90ms' }}
        >
          Log in to your CampusConnect account.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="animate-fade-in-up" style={{ animationDelay: '140ms' }}>
            <Input
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@college.edu"
            />
          </div>

          <div className="animate-fade-in-up" style={{ animationDelay: '190ms' }}>
            <Input
              label="Password"
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p key={shakeKey} className="text-sm text-[var(--color-coral)] animate-shake">
              {error}
            </p>
          )}

          <div
            className="flex items-center justify-between text-sm animate-fade-in-up"
            style={{ animationDelay: '240ms' }}
          >
            <Link
              to="/forgot-password"
              className="text-[var(--color-navy)] transition-opacity hover:opacity-70 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <div className="animate-fade-in-up" style={{ animationDelay: '290ms' }}>
            <Button
              type="submit"
              className="w-full transition-transform duration-150 active:scale-[0.98] hover:shadow-md"
              loading={loading}
            >
              Log in
            </Button>
          </div>
        </form>

        <p
          className="mt-6 text-center text-sm text-gray-500 animate-fade-in-up"
          style={{ animationDelay: '340ms' }}
        >
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-medium text-[var(--color-navy)] transition-opacity hover:opacity-70 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}