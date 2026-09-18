"use client";
import { Item, ExternalEvent } from "@/lib/types";
import { dayKey, dueLabel, formatDate, formatTime, addDays, startOfDay, sameDay } from "@/lib/utils";

export function CalendarToolbar({ label, onToday, onPrev, onNext }: { label: string; onToday: () => void; onPrev: () => void; onNext: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 my-4">
      <button onClick={onToday} className="min-h-11 min-w-11 px-1 text-brand text-[12.5px] font-bold">Today</button>
      <strong className="text-[14.5px] font-semibold tracking-[-0.01em] num">{label}</strong>
      <div className="flex items-center gap-1">
        <button onClick={onPrev} aria-label="Previous" className="w-11 h-11 rounded-sm border border-border bg-surface text-text-2 grid place-items-center hover:bg-surface-3"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="m14.5 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
        <button onClick={onNext} aria-label="Next" className="w-11 h-11 rounded-sm border border-border bg-surface text-text-2 grid place-items-center hover:bg-surface-3"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="m9.5 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
      </div>
    </div>
  );
}

export function WeekStrip({ startMonday, selected, now, onSelect }: { startMonday: Date; selected: Date; now: Date; onSelect: (d: Date) => void }) {
  return (
    <div className="grid grid-cols-7 gap-1">
      {[0, 1, 2, 3, 4, 5, 6].map((n) => {
        const d = addDays(startMonday, n);
        const sel = sameDay(d, selected);
        const isToday = sameDay(d, now);
        return (
          <button key={n} onClick={() => onSelect(d)} aria-selected={sel} aria-current={isToday ? "date" : undefined} className={`py-1.5 rounded-sm bg-surface border text-center transition-colors ${sel ? "border-brand bg-brand-tint" : "border-border hover:border-border-strong"} ${isToday ? "border-brand" : ""}`}>
            <span className={`block text-[10px] font-bold uppercase tracking-[0.05em] ${sel || isToday ? "text-brand" : "text-text-3"}`}>{formatDate(d, { weekday: "short" })}</span>
            <b className={`block mt-1 text-[14px] font-semibold num ${sel || isToday ? "text-brand" : ""}`}>{d.getDate()}</b>
          </button>
        );
      })}
    </div>
  );
}

export function MonthGrid({ cursor, selected, now, items, events, onSelect }: { cursor: Date; selected: Date; now: Date; items: Item[]; events: ExternalEvent[]; onSelect: (d: Date) => void }) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells = [];
  for (let n = 0; n < 42; n++) {
    const num = n - offset + 1;
    const date = new Date(cursor.getFullYear(), cursor.getMonth(), num);
    const inMonth = num >= 1 && num <= daysInMonth;
    const sel = sameDay(date, selected);
    const isToday = sameDay(date, now);
    const count = items.filter((i) => i.status === "open" && i.due_at && sameDay(new Date(i.due_at), date)).length;
    const dots = dotsFor(date, items, events);
    cells.push(
      <button key={n} onClick={() => onSelect(date)} aria-selected={sel} aria-label={`${formatDate(date, { weekday: "long", day: "numeric", month: "long" })}${count ? `, ${count} items` : ", nothing"}`} className={`relative min-h-[46px] p-1.5 rounded-sm border flex flex-col items-center gap-1 transition-colors ${!inMonth ? "bg-transparent border-transparent" : "bg-surface border-border hover:border-border-strong"} ${sel ? "border-brand bg-brand-tint" : ""} ${isToday ? "is-today" : ""}`}>
        <span className={`text-[12px] font-semibold w-[22px] h-[22px] grid place-items-center rounded-full num ${isToday ? "bg-brand text-on-brand" : sel ? "text-brand" : inMonth ? "text-text-1" : "text-text-3 opacity-55"}`}>{date.getDate()}</span>
        <span className="flex gap-[3px] min-h-[5px]">{dots}</span>
      </button>
    );
  }
  return (
    <div className="grid grid-cols-7 gap-1">
      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <span key={d} className="text-center text-text-3 text-[10px] font-bold uppercase tracking-[0.05em] py-1">{d}</span>)}
      {cells}
    </div>
  );
}

function dotsFor(date: Date, items: Item[], events: ExternalEvent[]) {
  const its = items.filter((i) => i.status === "open" && i.due_at && sameDay(new Date(i.due_at), date));
  const uniq: string[] = [];
  its.forEach((i) => { if (!uniq.includes(i.item_type)) uniq.push(i.item_type); });
  const hasEvent = events.some((e) => sameDay(new Date(e.start), date));
  return (
    <>
      {uniq.slice(0, 3).map((t) => <i key={t} className={`w-[5px] h-[5px] rounded-full ${dotColor(t)}`} aria-hidden />)}
      {hasEvent && <i className="w-[5px] h-[5px] rounded-full bg-info-fg" aria-hidden />}
    </>
  );
}

function dotColor(t: string) {
  if (t === "task") return "bg-brand";
  if (t === "grocery") return "bg-done-fg";
  if (t === "watch" || t === "read") return "bg-watch-fg";
  if (t === "expense") return "bg-attention-fg";
  if (t === "note") return "bg-border-strong";
  return "bg-brand";
}

export function AgendaDay({ date, items, events, onOpen }: { date: Date; items: Item[]; events: ExternalEvent[]; onOpen: (id: string) => void }) {
  const dayItems = items.filter((i) => i.status === "open" && i.due_at && sameDay(new Date(i.due_at), date)).sort((a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime());
  const dayEvents = events.filter((e) => sameDay(new Date(e.start), date));
  const rows = [
    ...dayItems.map((i) => (
      <div key={i.id} className="relative flex gap-3 items-stretch p-3 bg-surface border border-border rounded-md mb-2 shadow-e1 hover:border-border-strong hover:shadow-e2 transition-all">
        <button onClick={() => onOpen(i.id)} className="absolute inset-0 rounded-[inherit]" aria-label={`Open ${i.title}`} />
        <time className="w-14 text-text-2 text-[11.5px] font-bold pt-0.5 num">{i.due_at ? formatTime(i.due_at) : ""}</time>
        <span className={`w-[3px] rounded-full shrink-0 ${railColor(i.item_type)}`} aria-hidden />
        <span className="min-w-0 flex-1"><strong className="block text-[13.5px] font-semibold">{i.title}</strong><span className="block mt-1 text-text-3 text-[11.5px]">{i.item_type} · {i.nag_policy === "off" ? "No nudges" : "Nudges on"}</span></span>
      </div>
    )),
    ...dayEvents.map((e) => (
      <div key={e.id} className="relative flex gap-3 items-stretch p-3 bg-surface border border-border rounded-md mb-2 shadow-e1">
        <time className="w-14 text-text-2 text-[11.5px] font-bold pt-0.5 num">{formatTime(e.start)}</time>
        <span className="w-[3px] rounded-full shrink-0 bg-info-fg" aria-hidden />
        <span className="min-w-0 flex-1"><strong className="block text-[13.5px] font-semibold">{e.title}</strong><span className="block mt-1 text-text-3 text-[11.5px]">{e.duration} · {e.source}</span></span>
      </div>
    )),
  ];
  if (!rows.length) return <div className="text-center py-6 px-5 bg-surface border border-border rounded-md shadow-e1"><h3 className="m-0 text-[14.5px] font-semibold">Nothing scheduled</h3><p className="mt-1.5 text-text-2 text-[12.5px]">A clear day. Pull something forward from the queue, or leave it be.</p></div>;
  return <>{rows}</>;
}

function railColor(t: string) {
  if (t === "grocery") return "bg-done-fg";
  if (t === "watch" || t === "read") return "bg-watch-fg";
  if (t === "note") return "bg-border-strong";
  if (t === "expense") return "bg-attention-fg";
  if (t === "link") return "bg-info-fg";
  return "bg-brand";
}
