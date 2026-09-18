"use client";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export function BottomSheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setTimeout(() => sheetRef.current?.querySelector<HTMLElement>("input,select,textarea,button")?.focus(), 60);
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <div className={cn("fixed inset-0 z-[60] bg-[rgba(9,12,24,.44)] backdrop-blur-[2px] transition-opacity", open ? "opacity-100" : "opacity-0 pointer-events-none")} onClick={onClose} />
      <section
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn("fixed z-[61] left-0 right-0 bottom-0 md:left-1/2 md:-translate-x-1/2 md:w-[432px] max-h-[90vh] flex flex-col bg-surface rounded-t-xl md:rounded-t-xl shadow-e3 transition-transform duration-[260ms] ease-[cubic-bezier(.2,.8,.2,1)]", open ? "translate-y-0" : "translate-y-[102%]")}
      >
        <div className="w-10 h-1 rounded-full bg-border-strong mx-auto mt-2.5 mb-1 shrink-0" aria-hidden />
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border shrink-0">
          <div className="min-w-0">
            <h2 className="m-0 text-[18px] font-bold tracking-[-0.02em]">{title}</h2>
            {subtitle && <p className="mt-0.5 text-text-3 text-[11.5px]">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="ml-auto w-11 h-11 rounded-sm bg-surface-3 text-text-2 grid place-items-center hover:bg-border">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="m6.5 6.5 11 11M17.5 6.5l-11 11" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="shrink-0 p-3 px-5 pb-[calc(16px+env(safe-area-inset-bottom,0px))] border-t border-border bg-surface flex gap-2">{footer}</div>}
      </section>
    </>
  );
}
