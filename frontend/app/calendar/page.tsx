"use client";
import { useState, useMemo } from "react";
import { GlobalShell } from "@/components/layout/GlobalShell";
import { Segmented } from "@/components/ui/Segmented";
import { CalendarToolbar, WeekStrip, MonthGrid, AgendaDay } from "@/components/calendar/CalendarComponents";
import { useItemsStore } from "@/hooks/useItemsStore";
import { addDays, startOfDay, formatDate } from "@/lib/utils";
import { CalView, Item } from "@/lib/types";
import { EditorSheet } from "@/components/sheets/Sheets";

export default function CalendarPage() {
  return (
    <GlobalShell>
      <CalendarContent />
    </GlobalShell>
  );
}

function CalendarContent() {
  const { items, externalEvents, now, google, gmail, addItem, updateItem, deleteItem } = useItemsStore();
  const [calView, setCalView] = useState<CalView>("week");
  const [cursor, setCursor] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [selected, setSelected] = useState(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
  const [editing, setEditing] = useState<Item | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const filteredEvents = google ? externalEvents.filter((e) => e.source !== "Gmail detected" || gmail) : [];

  const startMonday = useMemo(() => {
    const mondayIdx = (now.getDay() + 6) % 7;
    return addDays(startOfDay(now), -mondayIdx);
  }, [now]);

  const monthLabel = formatDate(cursor, { month: "long", year: "numeric" });
  const weekLabel = `${formatDate(startMonday, { day: "numeric", month: "short" })} – ${formatDate(addDays(startMonday, 6), { day: "numeric", month: "short" })}`;

  const unscheduled = items.filter((i) => i.status === "open" && !i.due_at);

  const handleOpen = (id: string) => {
    const f = items.find((i) => i.id === id) || null;
    setEditing(f);
    setEditorOpen(true);
  };

  return (
    <div className="pb-6">
      <div className="mt-4 mb-2">
        <p className="m-0 text-text-3 text-[11px] font-bold uppercase tracking-[0.09em]">Your time, in view</p>
        <h1 className="mt-1 text-[26px] leading-[1.15] font-bold tracking-[-0.025em]">Calendar</h1>
      </div>

      <Segmented<CalView> ariaLabel="Calendar view" options={[{ value: "week", label: "Week" }, { value: "month", label: "Month" }, { value: "agenda", label: "Agenda" }]} value={calView} onChange={setCalView} />

      <CalendarToolbar
        label={calView === "week" ? weekLabel : calView === "month" ? monthLabel : "Next 7 days"}
        onToday={() => { setSelected(new Date(now.getFullYear(), now.getMonth(), now.getDate())); setCursor(new Date(now.getFullYear(), now.getMonth(), 1)); }}
        onPrev={() => { if (calView === "week") setSelected(addDays(selected, -7)); else if (calView === "month") setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1)); else setSelected(addDays(selected, -7)); }}
        onNext={() => { if (calView === "week") setSelected(addDays(selected, 7)); else if (calView === "month") setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)); else setSelected(addDays(selected, 7)); }}
      />

      <div id="calendarMount">
        {calView === "week" && <WeekStrip startMonday={startMonday} selected={selected} now={now} onSelect={setSelected} />}
        {calView === "month" && <MonthGrid cursor={cursor} selected={selected} now={now} items={items} events={filteredEvents} onSelect={(d) => { setSelected(d); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)); }} />}
        {calView === "agenda" && (
          <div className="grid gap-5">
            {[0, 1, 2, 3, 4, 5, 6].map((k) => {
              const d = addDays(startOfDay(now), k);
              return (
                <div key={k}>
                  <div className="flex items-baseline gap-2 mb-3"><h2 className="m-0 text-[13px] font-semibold">{k === 0 ? "Today" : formatDate(d, { weekday: "long" })}</h2><span className="text-text-3 text-[11.5px] font-semibold num">{items.filter((i) => i.status === "open" && i.due_at && new Date(i.due_at).toDateString() === d.toDateString()).length}</span><span className="flex-1 h-px bg-border" aria-hidden /></div>
                  <AgendaDay date={d} items={items} events={filteredEvents} onOpen={handleOpen} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mt-3 text-text-3 text-[11px] font-medium">
        {[["task", "Tasks"], ["grocery", "Groceries"], ["watch", "Watch later"], ["note", "Notes"], ["expense", "Expenses"], ["event", "Calendar event"]].map(([k, label]) => (
          <span key={k} className="inline-flex items-center gap-1.5"><i className={`w-1.5 h-1.5 rounded-full ${k === "task" ? "bg-brand" : k === "grocery" ? "bg-done-fg" : k === "watch" ? "bg-watch-fg" : k === "expense" ? "bg-attention-fg" : k === "note" ? "bg-border-strong" : "bg-info-fg"}`} aria-hidden />{label}</span>
        ))}
      </div>

      {calView !== "agenda" && (
        <div className="mt-5">
          <h3 className="m-0 mb-3 text-[14.5px] font-semibold tracking-[-0.01em] num">{selected.toDateString() === now.toDateString() ? `Today · ${formatDate(selected, { weekday: "long", day: "numeric", month: "long" })}` : `${formatDate(selected, { weekday: "long" })} · ${formatDate(selected, { day: "numeric", month: "long" })}`}</h3>
          <AgendaDay date={selected} items={items} events={filteredEvents} onOpen={handleOpen} />
        </div>
      )}

      <div className="mt-5">
        <div className="flex items-center justify-between gap-3 mb-3"><div><h2 className="m-0 text-[15px] font-semibold">Unscheduled</h2><p className="mt-0.5 text-text-3 text-[12px]">Ideas and notes without a date</p></div><button onClick={() => { setEditing(null); setEditorOpen(true); }} className="min-h-11 px-1 text-brand text-[12.5px] font-bold">Add item</button></div>
        <div className="grid gap-2">
          {unscheduled.length ? unscheduled.map((it) => (
            <div key={it.id} className="relative flex items-start gap-3 p-3 bg-surface border border-border rounded-md shadow-e1 hover:border-border-strong">
              <button onClick={() => handleOpen(it.id)} className="absolute inset-0 rounded-[inherit]" aria-label={`Open ${it.title}`} />
              <span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold">{it.title}</span><span className="mt-1.5 flex items-center gap-1.5 text-text-2 text-[12px]"><span className="inline-flex px-2 py-1 rounded-xs text-[10.5px] font-bold uppercase bg-neutral-bg text-neutral-fg">{it.item_type}</span>No date</span></span>
            </div>
          )) : <div className="text-center py-6 px-5 bg-surface border border-border rounded-md shadow-e1"><h3 className="m-0 text-[14px] font-semibold">No floating items</h3><p className="mt-1.5 text-text-2 text-[12.5px]">Every open loop has a date. Nice.</p></div>}
        </div>
      </div>

      <EditorSheet open={editorOpen} onClose={() => setEditorOpen(false)} item={editing} onSave={(data) => { if (data.id) updateItem(data.id, data); else addItem(data); }} onDelete={(id) => deleteItem(id)} />
    </div>
  );
}
