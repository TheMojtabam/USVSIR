export default function Loading() {
  return (
    <div className="min-h-screen grid place-items-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-gold grid place-items-center shadow-soft-2 animate-pulse-soft">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-bg-0" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>
        <div className="font-mono text-[11px] tracking-[0.18em] text-ink-3 uppercase">LOADING · INTEL</div>
      </div>
    </div>
  );
}
