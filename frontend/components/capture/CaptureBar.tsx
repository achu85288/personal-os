"use client";

export function CaptureBar({ onCapture, onVoice, onShare }: { onCapture: () => void; onVoice: () => void; onShare: () => void }) {
  return (
    <div className="flex items-center gap-2 w-full min-h-[60px] p-[5px_6px] bg-surface border border-border rounded-md shadow-e1 hover:border-border-strong hover:shadow-e2 transition-all">
      <button onClick={onCapture} className="flex-1 min-w-0 min-h-11 flex items-center gap-3 px-1 text-left rounded-sm active:scale-[0.985] transition-transform">
        <span className="shrink-0 w-[34px] h-[34px] rounded-sm bg-brand-tint text-brand grid place-items-center group-hover:rotate-90 transition-transform">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
        </span>
        <span className="min-w-0 flex-1">
          <b className="block text-[13.5px] font-semibold text-text-1">Capture anything</b>
          <small className="block mt-0.5 text-[11.5px] text-text-3">Task, thought, link — type or speak</small>
        </span>
      </button>
      <span className="flex items-center gap-0.5">
        <button onClick={onVoice} aria-label="Capture by voice" className="w-11 h-11 rounded-xs grid place-items-center text-text-3 hover:bg-surface-3 hover:text-brand transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="3" width="6" height="11.5" rx="3" /><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M8.5 21h7" /></svg>
        </button>
        <span className="w-px h-[22px] bg-border mx-0.5" aria-hidden />
        <button onClick={onShare} aria-label="Save something from another app" className="w-11 h-11 rounded-xs grid place-items-center text-text-3 hover:bg-surface-3 hover:text-brand transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15.5V3.5M8.5 7 12 3.5 15.5 7M5 13.5v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" /></svg>
        </button>
      </span>
    </div>
  );
}
