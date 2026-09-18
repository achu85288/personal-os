"use client";
import { useState, useMemo, Suspense } from "react";
import { GlobalShell } from "@/components/layout/GlobalShell";
import { SearchInput } from "@/components/ui/SearchInput";
import { Segmented } from "@/components/ui/Segmented";
import { LibraryRow } from "@/components/library/LibraryRow";
import { useItemsStore } from "@/hooks/useItemsStore";
import { Lens, ItemType, Item } from "@/lib/types";
import { ITEM_TYPE_META } from "@/lib/constants";
import { isOverdue, sameDay, startOfDay, addDays } from "@/lib/utils";
import { EditorSheet } from "@/components/sheets/Sheets";
import { useSearchParams } from "next/navigation";

export default function LibraryPage() {
  return (
    <GlobalShell>
      <Suspense fallback={<div className="p-5 text-text-3 text-[13px]">Loading library…</div>}>
        <LibraryContent />
      </Suspense>
    </GlobalShell>
  );
}

function LibraryContent() {
  const { items, now, updateItem, deleteItem, addItem } = useItemsStore();
  const searchParams = useSearchParams();
  const initialLens = (searchParams.get("lens") as Lens) || "all";
  const initialType = (searchParams.get("type") as ItemType | "all") || "all";

  const [lens, setLens] = useState<Lens>(initialLens);
  const [type, setType] = useState<ItemType | "all">(initialType as any);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Item | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const filtered = useMemo(() => {
    let base = items.filter((i) => type === "all" || i.item_type === type).filter((i) => !query || (i.title + " " + (i.body || "")).toLowerCase().includes(query.toLowerCase()));
    if (lens === "overdue") base = base.filter((i) => isOverdue(i, now));
    if (lens === "today") base = base.filter((i) => i.due_at && sameDay(new Date(i.due_at), now));
    if (lens === "week") base = base.filter((i) => i.due_at && new Date(i.due_at) >= startOfDay(now) && new Date(i.due_at) < addDays(startOfDay(now), 7));
    return base;
  }, [items, type, query, lens, now]);

  const buckets = [
    { k: "overdue", label: "Overdue", test: (i: Item) => isOverdue(i, now) },
    { k: "today", label: "Today", test: (i: Item) => i.due_at && sameDay(new Date(i.due_at), now) },
    { k: "week", label: "This week", test: (i: Item) => i.due_at && new Date(i.due_at) > addDays(startOfDay(now), 1) && new Date(i.due_at) < addDays(startOfDay(now), 7) },
    { k: "later", label: "Later", test: (i: Item) => i.due_at && new Date(i.due_at) >= addDays(startOfDay(now), 7) },
    { k: "none", label: "No date", test: (i: Item) => !i.due_at },
    { k: "done", label: "Done", test: (i: Item) => i.status !== "open" },
  ];

  return (
    <div className="pb-6">
      <div className="mt-4 mb-4">
        <p className="m-0 text-text-3 text-[11px] font-bold uppercase tracking-[0.09em]">Everything captured</p>
        <h1 className="mt-1 text-[26px] leading-[1.15] font-bold tracking-[-0.025em]">Library</h1>
      </div>

      <SearchInput value={query} onChange={setQuery} />

      <div className="mt-3">
        <Segmented<Lens> ariaLabel="Time lens" options={[{ value: "all", label: "All" }, { value: "overdue", label: "Overdue" }, { value: "today", label: "Today" }, { value: "week", label: "This week" }]} value={lens} onChange={setLens} />
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar py-3 -mx-5 px-5">
        {[{ k: "all", label: "Everything" }, ...Object.keys(ITEM_TYPE_META).map((k) => ({ k, label: ITEM_TYPE_META[k as ItemType].label }))].map((d) => {
          const n = d.k === "all" ? items.length : items.filter((i) => i.item_type === d.k).length;
          return (
            <button key={d.k} onClick={() => setType(d.k as any)} aria-pressed={type === d.k} className={`inline-flex items-center gap-1.5 min-h-10 px-3 border rounded-full text-[12px] font-semibold whitespace-nowrap transition-colors ${type === d.k ? "bg-brand-tint border-brand/30 text-brand" : "bg-surface border-border text-text-2 hover:border-border-strong hover:text-text-1"}`}>
              {d.k !== "all" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d={iconFor(d.k)} strokeLinecap="round" strokeLinejoin="round" /></svg>}
              {d.label}<span className="text-[11px] opacity-80 num">{n}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-2">
        {!filtered.length ? (
          <div className="text-center py-8 px-5 bg-surface border border-border rounded-md shadow-e1 mt-5">
            <div className="w-11 h-11 mx-auto mb-3 rounded-sm bg-brand-tint text-brand grid place-items-center"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="6.4" /><path d="m15.8 15.8 4.2 4.2" strokeLinecap="round" /></svg></div>
            <h3 className="m-0 text-[14.5px] font-semibold">{query ? `Nothing matches “${query}”` : "Nothing in this view"}</h3>
            <p className="mt-1.5 mx-auto max-w-[29ch] text-text-2 text-[12.5px]">{query ? "Try a different word, or clear the search to see everything." : "Change the lens or type filter to widen the net."}</p>
            <button onClick={() => { setQuery(""); setType("all"); setLens("all"); }} className="mt-4 min-h-11 px-3 rounded-sm bg-surface border border-border text-text-2 text-[12.5px] font-semibold">Clear filters</button>
          </div>
        ) : (
          buckets.map((b) => {
            const rows = filtered.filter(b.test as any);
            if (!rows.length) return null;
            const sorted = b.k === "done" ? [...rows].sort((a, b) => Number(b.id) - Number(a.id)) : [...rows].sort((a, b) => (a.due_at ? new Date(a.due_at).getTime() : Infinity) - (b.due_at ? new Date(b.due_at).getTime() : Infinity));
            return (
              <div key={b.k} className="mt-5">
                <div className="flex items-baseline gap-2 mb-3"><h2 className="m-0 text-[13px] font-semibold tracking-[-0.005em]">{b.label}</h2><span className="text-text-3 text-[11.5px] font-semibold num">{rows.length}</span><span className="flex-1 h-px bg-border" aria-hidden /></div>
                {sorted.map((it) => <LibraryRow key={it.id} item={it} now={now} onOpen={(id) => { const f = items.find((x) => x.id === id) || null; setEditing(f); setEditorOpen(true); }} />)}
              </div>
            );
          })
        )}
      </div>

      <EditorSheet open={editorOpen} onClose={() => setEditorOpen(false)} item={editing} onSave={(data) => { if (data.id) updateItem(data.id, data); else addItem(data); }} onDelete={(id) => deleteItem(id)} />
    </div>
  );
}

function iconFor(k: string): string {
  const m: Record<string, string> = {
    task: "M6 3.5h8L18.5 8v12.5h-12V3.5Z M13.5 3.5V8h5M9 12.5h6M9 16h4",
    grocery: "M5 8.5h14l-1.2 11.2a1.5 1.5 0 0 1-1.5 1.3H7.7a1.5 1.5 0 0 1-1.5-1.3L5 8.5Z M8.5 8.5a3.5 3.5 0 0 1 7 0",
    link: "m9.5 14.5 5-5M7.6 17.6l-1 1a3.2 3.2 0 0 1-4.6-4.6l3.4-3.4a3.2 3.2 0 0 1 4.6 0",
    read: "M5 5.5A2.5 2.5 0 0 1 7.5 3H20v15H7.5A2.5 2.5 0 0 0 5 20.5m0-15v15",
    watch: "M9 7.5 17 12l-8 4.5v-9Z",
    note: "M9 6.5h11M9 12h11M9 17.5h11",
    expense: "M3 6h18v12.5H3z M3 10.5h18M6.5 15h3",
  };
  return m[k] || m.task;
}
