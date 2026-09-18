"use client";
import { useState } from "react";

export function SearchInput({ value, onChange, placeholder = "Search titles and notes" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="flex items-center gap-2 h-[46px] px-3 bg-surface border border-border rounded-md shadow-e1 focus-within:border-brand focus-within:shadow-[0_0_0_3px_var(--brand-tint)] transition-all">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-text-3 shrink-0">
        <circle cx="11" cy="11" r="6.4" /><path d="m15.8 15.8 4.2 4.2" strokeLinecap="round" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 min-w-0 bg-transparent outline-none text-[13.5px] placeholder:text-text-3"
      />
      <button
        onClick={() => onChange("")}
        className={`w-[30px] h-[30px] rounded-full grid place-items-center text-text-3 transition-all ${value ? "opacity-100 scale-100" : "opacity-0 scale-70 pointer-events-none"}`}
        aria-label="Clear search"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="m6.5 6.5 11 11M17.5 6.5l-11 11" strokeLinecap="round" /></svg>
      </button>
    </div>
  );
}
