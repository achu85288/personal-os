"use client";
import { Item } from "@/lib/types";
import { dueLabel, isOverdue } from "@/lib/utils";
import { ITEM_TYPE_META } from "@/lib/constants";

export function LibraryRow({ item, now, onOpen }: { item: Item; now: Date; onOpen: (id: string) => void }) {
  const meta = ITEM_TYPE_META[item.item_type];
  return (
    <div className="relative flex items-center gap-3 p-3 bg-surface border border-border rounded-md mb-2 shadow-e1 hover:border-border-strong hover:shadow-e2 active:scale-[0.99] active:bg-surface-2 transition-all">
      <button onClick={() => onOpen(item.id)} className="absolute inset-0 rounded-[inherit]" aria-label={`Open ${item.title}`} />
      <span className={`w-8 h-8 rounded-sm grid place-items-center shrink-0 ${meta.chipClass}`} aria-hidden>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d={iconPath(meta.icon)} strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block text-[13.5px] font-semibold truncate tracking-[-0.005em]">{item.title}</strong>
        <span className="block mt-0.5 text-text-3 text-[11.5px] truncate">{item.status === "open" ? `${dueLabel(item.due_at, now)}${item.body ? ` · ${item.body}` : ""}` : "Completed"}</span>
      </span>
      <span className={`inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-xs whitespace-nowrap ${item.status === "open" ? (isOverdue(item, now) ? "bg-attention-bg text-attention-fg" : "bg-brand-tint text-brand") : "bg-done-bg text-done-fg"}`}>
        {item.status === "open" ? (isOverdue(item, now) ? "Overdue" : "Open") : "Done"}
      </span>
    </div>
  );
}

function iconPath(icon: string): string {
  const m: Record<string, string> = {
    doc: "M6 3.5h8L18.5 8v12.5h-12V3.5Z M13.5 3.5V8h5M9 12.5h6M9 16h4",
    cart: "M5 8.5h14l-1.2 11.2a1.5 1.5 0 0 1-1.5 1.3H7.7a1.5 1.5 0 0 1-1.5-1.3L5 8.5Z M8.5 8.5a3.5 3.5 0 0 1 7 0",
    link: "m9.5 14.5 5-5M7.6 17.6l-1 1a3.2 3.2 0 0 1-4.6-4.6l3.4-3.4a3.2 3.2 0 0 1 4.6 0",
    book: "M5 5.5A2.5 2.5 0 0 1 7.5 3H20v15H7.5A2.5 2.5 0 0 0 5 20.5m0-15v15",
    play: "M9 7.5 17 12l-8 4.5v-9Z",
    list: "M9 6.5h11M9 12h11M9 17.5h11",
    card: "M3 6h18v12.5H3z M3 10.5h18M6.5 15h3",
  };
  return m[icon] || m.doc;
}
