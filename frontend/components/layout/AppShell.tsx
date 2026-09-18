"use client";
import { useState, useEffect, useRef } from "react";
import { Topbar } from "./Topbar";
import { Tabbar } from "./Tabbar";
import { Drawer } from "./Drawer";
import { ToastHost } from "@/components/ui/Toast";
import { Item } from "@/lib/types";

export function AppShell({
  children,
  openCount,
  onOpenSheet,
}: {
  children: React.ReactNode;
  openCount: number;
  onOpenSheet: (id: string, payload?: any) => void;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 6);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#E7EAF1] dark:bg-[#05070D] flex justify-center items-start p-0 md:p-6">
      <div className="relative w-full max-w-[432px] min-h-screen md:min-h-0 md:h-[min(940px,100vh-48px)] bg-bg md:rounded-xl shadow-[0_30px_80px_-30px_rgba(15,23,41,.35),0_0_0_1px_rgba(15,23,41,.05)] flex flex-col overflow-hidden">
        <div className="h-[26px] hidden md:flex items-center justify-between px-5 pt-2 text-text-3 text-[11px] font-semibold shrink-0" aria-hidden>
          <span>9:41</span>
          <span className="flex gap-1 items-center"><i className="block w-[3px] h-[3px] rounded-full bg-current opacity-85" /><i className="block w-[3px] h-[3px] rounded-full bg-current opacity-85" /><i className="block w-[3px] h-[3px] rounded-full bg-current opacity-85" /><span className="w-[17px] h-2 border-[1.5px] border-current rounded-[3px] ml-0.5 relative"><b className="block w-[11px] h-[3px] m-px bg-current rounded-[1px]" /></span></span>
        </div>

        <Topbar scrolled={scrolled} onMenu={() => setDrawerOpen(true)} onNudge={() => onOpenSheet("nudgeSheet")} onProfile={() => onOpenSheet("profileSheet")} />

        <div ref={viewportRef} className="flex-1 overflow-y-auto overscroll-contain px-5 pb-[108px] no-scrollbar">
          {children}
        </div>

        <Tabbar openCount={openCount} />
        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onOpenSheet={onOpenSheet} />
        <ToastHost />
      </div>
    </div>
  );
}
