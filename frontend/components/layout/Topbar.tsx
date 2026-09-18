"use client";
import { useEffect, useState } from "react";

export function Topbar({
  onMenu,
  onNudge,
  onProfile,
  scrolled,
}: {
  onMenu: () => void;
  onNudge: () => void;
  onProfile: () => void;
  scrolled?: boolean;
}) {
  return (
    <header className={`sticky top-0 z-10 flex items-center gap-3 px-5 py-2.5 bg-bg border-b transition-all ${scrolled ? "border-border shadow-[0_6px_16px_-14px_rgba(15,23,41,.45)]" : "border-transparent"}`}>
      <button onClick={onMenu} aria-label="Open navigation" className="w-11 h-11 rounded-sm grid place-items-center text-text-2 hover:bg-surface-3 hover:text-text-1">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
      </button>
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="w-[34px] h-[34px] rounded-sm bg-gradient-to-br from-[#5B52E8] to-[#4338CA] text-white grid place-items-center shadow-brand">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 4v16M4 12h16" /><circle cx="12" cy="12" r="8.6" strokeWidth="1.4" opacity=".5" /></svg>
        </span>
        <span className="leading-[1.1] min-w-0">
          <strong className="block text-[14px] font-[650] tracking-[-0.01em]">Personal OS</strong>
          <small className="block mt-0.5 text-text-3 text-[10px] font-semibold uppercase tracking-[0.09em]">your second brain</small>
        </span>
      </div>
      <div className="ml-auto flex items-center gap-1">
        <button onClick={onNudge} aria-label="Preview a nudge" className="relative w-11 h-11 rounded-sm grid place-items-center text-text-2 hover:bg-surface-3 hover:text-text-1">
          <span className="absolute top-[9px] right-[10px] w-2 h-2 rounded-full bg-[#E5484D] shadow-[0_0_0_2px_var(--bg)] animate-[dotPulse_2.6s_ease_infinite]" />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M18 9a6 6 0 1 0-12 0c0 6.5-2.5 6.5-2.5 8.5h17C20.5 15.5 18 15.5 18 9Z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></svg>
        </button>
        <button onClick={onProfile} aria-label="Open profile — Alex Kim" className="w-11 h-11 grid place-items-center rounded-full hover:shadow-[0_0_0_3px_var(--brand-tint)]">
          <b className="w-[34px] h-[34px] rounded-full bg-brand-tint-2 text-brand grid place-items-center text-[12px] font-bold">AK</b>
        </button>
      </div>
    </header>
  );
}
