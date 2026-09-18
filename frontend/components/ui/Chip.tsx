"use client";
import { cn } from "@/lib/utils";
import { ITEM_TYPE_META } from "@/lib/constants";
import { ItemType } from "@/lib/types";

export function Chip({ children, variant = "neutral", className }: { children: React.ReactNode; variant?: "neutral" | "attention" | "done" | "info" | "watch" | "soft" | "plain" | ItemType; className?: string }) {
  const map: Record<string, string> = {
    neutral: "bg-neutral-bg text-neutral-fg",
    attention: "bg-attention-bg text-attention-fg",
    done: "bg-done-bg text-done-fg",
    info: "bg-info-bg text-info-fg",
    watch: "bg-watch-bg text-watch-fg",
    soft: "bg-brand-tint text-brand",
    plain: "bg-transparent text-text-3 px-0",
  };
  let cls = map[variant] || "";
  if (variant in ITEM_TYPE_META) {
    cls = ITEM_TYPE_META[variant as ItemType].chipClass;
  }
  return (
    <span className={cn("inline-flex items-center gap-[5px] px-2 py-1 rounded-xs text-[10.5px] font-bold uppercase tracking-[0.05em] whitespace-nowrap", cls, className)}>
      {children}
    </span>
  );
}
