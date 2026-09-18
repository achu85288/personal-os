"use client";
import { Stats } from "@/lib/types";

export function StatsStrip({ stats, onSelect }: { stats: Stats; onSelect: (lens: "overdue" | "today" | "all") => void }) {
  const tiles = [
    { key: "overdue" as const, label: "Overdue", value: stats.overdue, cls: stats.overdue ? "bg-attention-bg border-attention-fg/20 text-attention-fg" : "bg-done-bg border-done-fg/20" },
    { key: "today" as const, label: "Due today", value: stats.today, cls: "" },
    { key: "open" as const, label: "Open loops", value: stats.open, cls: "" },
  ];
  return (
    <div className="grid grid-cols-3 gap-2 mt-4">
      {tiles.map((t) => (
        <button
          key={t.key}
          onClick={() => onSelect(t.key === "open" ? "all" : t.key)}
          className={`text-left p-[11px_12px_12px] bg-surface border border-border rounded-md hover:border-border-strong hover:shadow-e1 active:scale-[0.975] transition-all ${t.cls}`}
          aria-label={`${t.label}: ${t.value}. Show in Library`}
        >
          <b className={`block text-[22px] leading-none font-bold tracking-[-0.02em] ${t.key === "overdue" && stats.overdue ? "text-attention-fg" : t.key === "overdue" ? "text-done-fg" : ""}`}>{t.value}</b>
          <span className="block mt-1.5 text-[10.5px] font-bold text-text-3 uppercase tracking-[0.06em]">{t.label}</span>
        </button>
      ))}
    </div>
  );
}
