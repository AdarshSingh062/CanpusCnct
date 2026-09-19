import { Outlet, Link } from 'react-router-dom';
import { ShaderBackground } from '../components/ui/plasma-shader';

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[var(--color-navy)] p-10 text-white lg:flex">
        <ShaderBackground className="pointer-events-none absolute inset-0 h-full w-full opacity-20" />
        <div className="relative z-10 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-marigold)] font-display text-sm font-bold text-[var(--color-ink)]">
            CC
          </div>
          <span className="font-display text-xl font-semibold">CampusConnect</span>
        </div>
        <div className="relative z-10">
          <h1 className="font-display text-4xl font-semibold leading-tight">
            One hub for<br />everything campus.
          </h1>
          <p className="mt-4 max-w-sm text-white/70">
            Feed, complaints, events, clubs, notes, marketplace, and opportunities —
            built for students, faculty, and administrators alike.
          </p>
        </div>
        <p className="relative z-10 text-xs text-white/40">© {new Date().getFullYear()} CampusConnect</p>
      </div>

      <div className="flex w-full flex-col items-center justify-center bg-[var(--color-bg)] p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-navy)] font-display text-sm font-bold text-white">
              CC
            </div>
            <span className="font-display text-lg font-semibold">CampusConnect</span>
          </Link>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
