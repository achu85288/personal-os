"use client";
import { Item } from "@/lib/types";
import { dueLabel, isOverdue } from "@/lib/utils";
import { Chip } from "@/components/ui/Chip";

export function ItemRow({ item, now, onOpen, onDone }: { item: Item; now: Date; onOpen: (id: string) => void; onDone: (id: string) => void }) {
  const overdue = isOverdue(item, now);
  return (
    <div className={`relative flex items-start gap-3 p-3 bg-surface border border-border rounded-md shadow-e1 hover:border-border-strong hover:shadow-e2 active:scale-[0.99] transition-all ${overdue ? "overdue" : ""}`}>
      <button onClick={() => onOpen(item.id)} className="absolute inset-0 rounded-[inherit] z-[1]" aria-label={`Open ${item.title}`} />
      <button onClick={(e) => { e.stopPropagation(); onDone(item.id); }} className="relative z-[2] w-11 h-11 -my-3 -ml-3 rounded-sm grid place-items-center group" aria-label={`Mark ${item.title} done`}>
        <span className="absolute w-[22px] h-[22px] rounded-full border-[1.75px] border-border-strong bg-surface group-hover:border-brand group-hover:bg-brand-tint transition-colors" />
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="relative scale-[0.6] opacity-0 group-hover:scale-100 group-hover:opacity-100 text-brand transition-all"><path d="m5.5 12.5 4.2 4.2L18.5 7.8" /></svg>
      </button>
      <span className="min-w-0 flex-1 relative z-0">
        <span className="block text-[14px] leading-[1.35] font-semibold tracking-[-0.01em] text-text-1">{item.title}</span>
        <span className="mt-1.5 flex items-center gap-1.5 flex-wrap text-text-2 text-[12px]">
          <Chip variant={item.item_type}>{item.item_type}</Chip>
          <span className={`inline-flex items-center gap-1 font-medium ${overdue ? "text-attention-fg font-semibold" : ""}`}>
            {overdue && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="8.2" /><path d="M12 7.5V12l3 2" strokeLinecap="round" /></svg>}
            {overdue ? `Overdue · ${dueLabel(item.due_at, now)}` : dueLabel(item.due_at, now)}
          </span>
          {overdue && <><span className="w-[3px] h-[3px] rounded-full bg-border-strong" /><span>Nudged twice</span></>}
        </span>
      </span>
      <span className="flex items-center gap-0.5 self-center relative z-0 text-[#9AA5BE]"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="m9.5 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
    </div>
  );
}

export function WatchRow({ item, onOpen }: { item: Item; onOpen: (id: string) => void }) {
  return (
    <div className="relative flex gap-3 items-center p-2.5 bg-surface border border-border rounded-md shadow-e1 hover:border-border-strong hover:shadow-e2 active:scale-[0.99] transition-all">
      <button onClick={() => onOpen(item.id)} className="absolute inset-0 rounded-[inherit] z-[1]" aria-label={`Open ${item.title}`} />
      <span className="relative w-16 h-12 rounded-sm shrink-0 overflow-hidden bg-gradient-to-br from-[#F2B58C] to-[#6B5BDB] grid place-items-center text-white">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M9 7.5 17 12l-8 4.5v-9Z" /></svg>
        <span className="absolute right-1 bottom-1 z-[2] bg-[rgba(9,12,24,.72)] text-white text-[9.5px] font-bold px-1 py-0.5 rounded-[4px] tracking-[0.02em] num">{item.duration || ""}</span>
      </span>
      <span className="min-w-0 flex-1 relative z-0">
        <strong className="block text-[13.5px] font-semibold truncate">{item.title}</strong>
        <span className="block mt-1 text-text-3 text-[11.5px] truncate">{(item.platform ? `${item.platform} · ` : "") + (item.due_at ? dueLabel(item.due_at) : "")}</span>
      </span>
      <span className="relative z-0 text-[#9AA5BE]"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="m9.5 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
    </div>
  );
}
