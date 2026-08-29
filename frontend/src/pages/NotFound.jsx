import { Link } from 'react-router-dom';
import Button from '../components/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--color-bg)] text-center">
      <h1 className="font-display text-6xl font-bold text-[var(--color-navy)]">404</h1>
      <p className="text-gray-500">This page doesn't exist.</p>
      <Link to="/dashboard"><Button>Back to Dashboard</Button></Link>
    </div>
  );
}
