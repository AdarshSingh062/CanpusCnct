import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchApi } from '../services/endpoints';

const RESULT_ROUTES = {
  students: (id) => `/profile/${id}`,
  posts: () => `/feed`,
  events: (id) => `/events/${id}`,
  clubs: (id) => `/clubs/${id}`,
  notes: () => `/resources`,
  marketplace: (id) => `/marketplace/${id}`,
  opportunities: (id) => `/opportunities`,
  lostfound: (id) => `/lost-found`,
};

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    clearTimeout(timeoutRef.current);
    if (query.trim().length < 2) { setResults(null); return; }
    timeoutRef.current = setTimeout(async () => {
      const res = await searchApi.global(query.trim());
      setResults(res.data.data);
      setOpen(true);
    }, 350);
    return () => clearTimeout(timeoutRef.current);
  }, [query]);

  const flatResults = results
    ? Object.entries(results).flatMap(([type, items]) => (items || []).map((item) => ({ type, item })))
    : [];

  return (
    <div className="relative w-full max-w-md">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.length >= 2 && setOpen(true)}
        placeholder="Search students, events, notes, listings…"
        className="w-full rounded-lg border border-[var(--color-line)] bg-gray-50 py-2 pl-9 pr-3 text-sm focus:border-[var(--color-navy)] focus:bg-white focus:outline-none"
      />
      {open && results && (
        <div className="absolute z-50 mt-1 max-h-96 w-full overflow-y-auto rounded-xl border border-[var(--color-line)] bg-white shadow-lg">
          {flatResults.length === 0 && <p className="px-4 py-6 text-center text-sm text-gray-400">No results for "{query}"</p>}
          {flatResults.map(({ type, item }) => (
            <button
              key={`${type}-${item._id}`}
              onClick={() => { navigate(RESULT_ROUTES[type]?.(item._id) || '/dashboard'); setOpen(false); setQuery(''); }}
              className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-gray-50"
            >
              <span className="truncate">{item.name || item.title || item.content?.slice(0, 60)}</span>
              <span className="ml-2 shrink-0 text-xs uppercase text-gray-400">{type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
