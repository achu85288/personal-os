"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Drawer({ open, onClose, onOpenSheet }: { open: boolean; onClose: () => void; onOpenSheet: (id: string) => void }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <div className={`fixed inset-0 z-[38] bg-[rgba(9,12,24,.42)] backdrop-blur-[2px] transition-opacity ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={onClose} />
      <aside className={`fixed z-40 top-0 bottom-0 left-0 w-[min(310px,86%)] md:left-1/2 md:-translate-x-[216px] bg-surface shadow-e3 border-r border-border flex flex-col overflow-y-auto transition-transform duration-[260ms] ease-[cubic-bezier(.2,.8,.2,1)] ${open ? "translate-x-0" : "-translate-x-[102%]"}`} role="dialog" aria-modal="true" aria-label="Navigation menu">
        <div className="flex items-center gap-2.5 p-5 pb-4 border-b border-border">
          <span className="w-8 h-8 rounded-sm bg-gradient-to-br from-[#5B52E8] to-[#4338CA] text-white grid place-items-center shadow-brand">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 4v16M4 12h16" /></svg>
          </span>
          <span><strong className="block text-[13.5px] font-semibold">Personal OS</strong><small className="block text-text-3 text-[9.5px] font-bold uppercase tracking-[0.09em] mt-0.5">your second brain</small></span>
          <button onClick={onClose} aria-label="Close navigation" className="ml-auto w-11 h-11 rounded-sm grid place-items-center text-text-2 hover:bg-surface-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="m6.5 6.5 11 11M17.5 6.5l-11 11" strokeLinecap="round" /></svg>
          </button>
        </div>

        <div className="flex items-center gap-3 px-5 py-4">
          <span className="w-9 h-9 rounded-full bg-brand-tint-2 text-brand grid place-items-center text-[13px] font-bold">AK</span>
          <span><strong className="block text-[13px] font-semibold">Alex Kim</strong><span className="block text-text-3 text-[11.5px] mt-0.5">alex@example.com</span></span>
        </div>

        <nav className="grid gap-0.5 px-4">
          {[
            { href: "/", label: "Dashboard", icon: "M3.5 3.5h7v7h-7zM13.5 3.5h7v7h-7zM3.5 13.5h7v7h-7zM13.5 13.5h7v7h-7z" },
            { href: "/calendar", label: "Calendar", icon: "M3.5 5h17v15.5h-17z M8 3v4M16 3v4M3.5 10h17" },
            { href: "/library", label: "Library", icon: "M5 5.5A2.5 2.5 0 0 1 7.5 3H20v15H7.5A2.5 2.5 0 0 0 5 20.5m0-15v15M5 20.5A2.5 2.5 0 0 0 7.5 23" },
            { href: "/chat", label: "Chat capture", icon: "M20.5 11.8a7.7 7.7 0 0 1-8.2 7.4 9 9 0 0 1-2.9-.5L4.5 20.5l1.4-4a7.6 7.6 0 0 1-1.4-4.7A7.7 7.7 0 0 1 12.3 4.4a7.7 7.7 0 0 1 8.2 7.4Z" },
          ].map((it) => (
            <Link key={it.href} href={it.href} onClick={onClose} className={`flex items-center gap-3 w-full min-h-[44px] px-3 rounded-sm text-[13px] font-semibold text-left transition-colors ${isActive(it.href) ? "bg-brand-tint text-brand" : "text-text-2 hover:bg-surface-3 hover:text-text-1"}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d={it.icon} strokeLinecap="round" strokeLinejoin="round" /></svg>
              {it.label}
            </Link>
          ))}
        </nav>

        <div className="h-px bg-border my-4 mx-4" />
        <p className="text-text-3 text-[10.5px] font-bold uppercase tracking-[0.09em] px-6 mb-2">Personal</p>
        <nav className="grid gap-0.5 px-4">
          {[
            { id: "insightsSheet", label: "Productivity insights", icon: "M5.5 20V11M12 20V4.5M18.5 20v-6" },
            { id: "profileSheet", label: "Profile", icon: "M12 8.2a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2zM5 20.2a7 7 0 0 1 14 0" },
            { id: "settingsSheet", label: "Settings", icon: "M12 12a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4z" },
            { id: "connectionsSheet", label: "Connections", icon: "M10 13.5a5 5 0 0 0 7.4.5l1.8-1.8a5 5 0 0 0-7-7l-1 1M14 10.5a5 5 0 0 0-7.4-.5L4.8 11.8a5 5 0 0 0 7 7l1-1" },
          ].map((it) => (
            <button key={it.id} onClick={() => { onClose(); setTimeout(() => onOpenSheet(it.id), 180); }} className="flex items-center gap-3 w-full min-h-[44px] px-3 rounded-sm text-[13px] font-semibold text-left text-text-2 hover:bg-surface-3 hover:text-text-1 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d={it.icon} strokeLinecap="round" strokeLinejoin="round" /></svg>
              {it.label}
            </button>
          ))}
        </nav>

        <p className="mt-auto p-6 pt-4 text-text-3 text-[11.5px] leading-[1.5]">Personal OS keeps your open loops visible, calm and actionable.</p>
      </aside>
    </>
  );
}
