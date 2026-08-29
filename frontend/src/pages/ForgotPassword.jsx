import { useState } from 'react';
import { Link } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import { authApi } from '../services/endpoints';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div>
        <h2 className="font-display text-2xl font-semibold">Check your email</h2>
        <p className="mt-2 text-sm text-gray-500">
          If an account exists for <strong>{email}</strong>, we've sent a password reset link.
        </p>
        <Link to="/login" className="mt-4 inline-block text-sm font-medium text-[var(--color-navy)] hover:underline">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold">Reset your password</h2>
      <p className="mt-1 text-sm text-gray-500">Enter your email and we'll send you a reset link.</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button type="submit" className="w-full" loading={loading}>Send reset link</Button>
      </form>
    </div>
  );
}
