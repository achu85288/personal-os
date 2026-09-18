"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [pillStyle, setPillStyle] = useState({ width: 0, x: 0 });

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const active = wrap.querySelector(`[data-val="${value}"]`) as HTMLElement;
    if (!active) return;
    setPillStyle({ width: active.offsetWidth, x: active.offsetLeft });
  }, [value, options]);

  return (
    <div ref={wrapRef} role="tablist" aria-label={ariaLabel} className="relative flex gap-0.5 p-[3px] bg-surface-3 rounded-sm">
      <span className="absolute top-[3px] h-[calc(100%-6px)] bg-surface rounded-[7px] shadow-e1 transition-all duration-200 ease-[cubic-bezier(.2,.8,.2,1)]" style={{ width: pillStyle.width, transform: `translateX(${pillStyle.x}px)` }} aria-hidden />
      {options.map((opt) => (
        <button
          key={opt.value}
          data-val={opt.value}
          role="tab"
          aria-selected={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn("relative z-10 flex-1 min-h-[40px] rounded-[7px] text-[12px] font-bold transition-colors", value === opt.value ? "text-brand" : "text-text-2 hover:text-text-1")}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
