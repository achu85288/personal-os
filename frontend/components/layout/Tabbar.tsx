"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Now", icon: "grid" },
  { href: "/chat", label: "Chat", icon: "chat" },
  { href: "/library", label: "Library", icon: "book" },
  { href: "/calendar", label: "Calendar", icon: "cal" },
] as const;

function Icon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    grid: "M3.5 3.5h7v7h-7zM13.5 3.5h7v7h-7zM3.5 13.5h7v7h-7zM13.5 13.5h7v7h-7z",
    chat: "M20.5 11.8a7.7 7.7 0 0 1-8.2 7.4 9 9 0 0 1-2.9-.5L4.5 20.5l1.4-4a7.6 7.6 0 0 1-1.4-4.7A7.7 7.7 0 0 1 12.3 4.4a7.7 7.7 0 0 1 8.2 7.4Z",
    book: "M5 5.5A2.5 2.5 0 0 1 7.5 3H20v15H7.5A2.5 2.5 0 0 0 5 20.5m0-15v15M5 20.5A2.5 2.5 0 0 0 7.5 23",
    cal: "M3.5 5h17v15.5h-17z M8 3v4M16 3v4M3.5 10h17",
  };
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" aria-hidden>
      <path d={paths[name] || paths.grid} strokeLinecap="round" />
    </svg>
  );
}

export function Tabbar({ openCount }: { openCount?: number }) {
  const pathname = usePathname();
  return (
    <nav className="fixed z-20 left-0 right-0 bottom-0 md:left-1/2 md:-translate-x-1/2 md:w-[432px] md:mx-auto px-3.5 pt-1.5 pb-[calc(8px+env(safe-area-inset-bottom,0px))] bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] backdrop-blur-[20px] border-t border-border grid grid-cols-4 gap-0.5">
      {tabs.map((t) => {
        const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn("relative flex flex-col items-center justify-center gap-[3px] min-h-[52px] rounded-sm text-[10.5px] font-bold tracking-[0.01em] transition-colors", active ? "text-brand" : "text-text-3 hover:text-text-2")}
          >
            <Icon name={t.icon} />
            <span>{t.label}</span>
            {t.href === "/library" && openCount ? (
              <span className="absolute top-1.5 right-[calc(50%-18px)] min-w-4 h-4 px-1 rounded-full bg-brand text-on-brand text-[9.5px] font-bold grid place-items-center shadow-[0_0_0_2px_var(--surface)] num">{openCount}</span>
            ) : null}
            <i className={cn("absolute bottom-0.5 w-4 h-[3px] rounded-full bg-brand transition-all", active ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0")} aria-hidden />
          </Link>
        );
      })}
    </nav>
  );
}
