export default function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-[var(--color-coral)]/30 bg-red-50 px-6 py-10 text-center">
      <p className="text-sm font-medium text-[var(--color-coral)]">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-sm font-medium text-[var(--color-navy)] underline">
          Try again
        </button>
      )}
    </div>
  );
}
