"use client";
import { Item } from "@/lib/types";
import { dueLabel, fromNow, isOverdue } from "@/lib/utils";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { NAG_LABEL, NAG_CHIP } from "@/lib/constants";

export function FocusCard({ item, now, onDone, onSnooze, onOpen }: { item: Item | null; now: Date; onDone: (id: string) => void; onSnooze: (id: string) => void; onOpen: (id: string) => void }) {
  if (!item) {
    return (
      <div className="text-center py-8 px-5 bg-surface border border-border rounded-md shadow-e1">
        <div className="w-11 h-11 mx-auto mb-3 rounded-sm bg-brand-tint text-brand grid place-items-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 3.5 13.6 9 19 10.5 13.6 12 12 17.5 10.4 12 5 10.5 10.4 9 12 3.5Z" /></svg>
        </div>
        <h3 className="m-0 text-[14.5px] font-semibold">Nothing is asking for your attention</h3>
        <p className="mt-1.5 mx-auto max-w-[29ch] text-text-2 text-[12.5px]">Everything captured is either done or parked for later. Enjoy the quiet.</p>
      </div>
    );
  }

  const overdue = isOverdue(item, now);
  const nextNudge = item.nag_policy === "off" ? "never — this one stays quiet" : item.nag_policy === "relentless" ? "every three hours" : item.due_at && new Date(item.due_at) < now ? "goes out this evening" : `goes out at ${dueLabel(item.due_at, now).toLowerCase()}`;

  return (
    <div className="relative p-4 pl-[calc(16px+4px)] bg-surface border border-border border-l-[3px] border-l-brand rounded-md shadow-e1 hover:shadow-e2 transition-shadow">
      <button onClick={() => onOpen(item.id)} className="block w-full text-left rounded-sm">
        <span className="block text-[19px] leading-[1.25] font-semibold tracking-[-0.015em] text-text-1 mb-3">{item.title}</span>
        <span className="flex items-center gap-2 flex-wrap">
          <Chip variant={item.item_type}>{item.item_type}</Chip>
          <span className="inline-flex items-center gap-1 text-text-3 text-[11px] font-bold uppercase"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="8.2" /><path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" /></svg>{NAG_CHIP[item.nag_policy]}</span>
          {overdue && <Chip variant="attention">Overdue</Chip>}
        </span>
        <span className="mt-2 flex items-center gap-1.5 flex-wrap text-text-2 text-[12.5px]">
          <span>{dueLabel(item.due_at, now)}</span><span className="w-[3px] h-[3px] rounded-full bg-border-strong" aria-hidden /><span>{fromNow(item.due_at, now)}</span>
        </span>
      </button>
      <p className="mt-3 p-2.5 bg-surface-2 border border-dashed border-border-strong rounded-sm text-text-2 text-[12px] flex gap-2 items-start">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="shrink-0 mt-0.5 text-brand"><path d="M18 9a6 6 0 1 0-12 0c0 6.5-2.5 6.5-2.5 8.5h17C20.5 15.5 18 15.5 18 9Z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></svg>
        <span>Nudges: {NAG_LABEL[item.nag_policy].toLowerCase()} · next reminder {nextNudge}.</span>
      </p>
      <span className="flex gap-2 mt-4">
        <Button variant="secondary" onClick={() => onSnooze(item.id)}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="8.2" /><path d="M12 7.5V12l3 2" strokeLinecap="round" /></svg>Snooze</Button>
        <Button variant="primary" grow onClick={() => onDone(item.id)}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5.5 12.5 4.2 4.2L18.5 7.8" /></svg>Mark done</Button>
      </span>
    </div>
  );
}
