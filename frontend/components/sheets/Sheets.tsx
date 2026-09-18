"use client";
import { useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Item } from "@/lib/types";
import { toLocalInputValue, fromLocalInputValue } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";
import { useTheme } from "@/hooks/useTheme";

export function EditorSheet({ open, onClose, item, onSave, onDelete }: { open: boolean; onClose: () => void; item: Item | null; onSave: (data: Partial<Item> & { id?: string }) => void; onDelete?: (id: string) => void }) {
  const editing = !!item;
  const [title, setTitle] = useState(item?.title || "");
  const [type, setType] = useState<Item["item_type"]>(item?.item_type || "task");
  const [due, setDue] = useState(toLocalInputValue(item?.due_at || null));
  const [nag, setNag] = useState<Item["nag_policy"]>(item?.nag_policy || "normal");
  const [body, setBody] = useState(item?.body || "");
  const [err, setErr] = useState(false);

  // reset when item changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const key = item?.id || "new";
  // using effect via key prop in parent would be better, but simple here
  if (typeof window !== "undefined") {
    // sync on open
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setErr(true); return; }
    onSave({ id: item?.id, title: title.trim(), item_type: type, due_at: fromLocalInputValue(due), nag_policy: nag, body: body.trim() || null });
    onClose();
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={editing ? "Edit item" : "Capture an item"}
      subtitle={editing ? "Changes are saved instantly" : "It lands in Now and Library"}
      footer={
        <>
          {editing && onDelete && <Button variant="danger" onClick={() => { if (item) onDelete(item.id); onClose(); }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M4.5 7h15M9.5 7V5h5v2M6.5 7l1 13h9l1-13M10.5 11v5.5M13.5 11v5.5" strokeLinecap="round" strokeLinejoin="round" /></svg>Drop</Button>}
          <Button variant="primary" grow type="submit" form="editorForm">Save item</Button>
        </>
      }
    >
      <form id="editorForm" onSubmit={handleSubmit} className="grid gap-4" noValidate>
        <div className={`grid gap-1.5 ${err ? "invalid" : ""}`}>
          <label className="block ml-px text-text-2 text-[11px] font-bold uppercase tracking-[0.08em]">Title</label>
          <input value={title} onChange={(e) => { setTitle(e.target.value); setErr(false); }} placeholder="What needs to happen?" className={`w-full min-h-[46px] p-3 border bg-surface-2 rounded-sm text-[13.5px] outline-none focus:border-brand focus:bg-surface focus:shadow-[0_0_0_3px_var(--brand-tint)] transition-all ${err ? "border-danger-fg shadow-[0_0_0_3px_var(--c-danger-bg)]" : "border-border"}`} />
          {err && <p className="flex items-center gap-1 ml-px text-[11.5px] font-semibold text-danger-fg"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><circle cx="12" cy="12" r="8.6" /><path d="M12 7.8v5M12 15.8h.01" strokeLinecap="round" /></svg>Give it a title so you will recognise it later.</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5"><label className="block ml-px text-text-2 text-[11px] font-bold uppercase tracking-[0.08em]">Type</label><select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full min-h-[46px] p-3 border border-border bg-surface-2 rounded-sm text-[13.5px] outline-none focus:border-brand focus:bg-surface focus:shadow-[0_0_0_3px_var(--brand-tint)]"><option value="task">Task</option><option value="grocery">Grocery</option><option value="watch">Watch later</option><option value="link">Link</option><option value="note">Note</option><option value="expense">Expense</option></select></div>
          <div className="grid gap-1.5"><label className="block ml-px text-text-2 text-[11px] font-bold uppercase tracking-[0.08em]">Due</label><input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} className="w-full min-h-[46px] p-3 border border-border bg-surface-2 rounded-sm text-[13.5px] outline-none focus:border-brand focus:bg-surface focus:shadow-[0_0_0_3px_var(--brand-tint)]" /></div>
        </div>
        <div className="grid gap-1.5"><label className="block ml-px text-text-2 text-[11px] font-bold uppercase tracking-[0.08em]">Nudge policy</label><select value={nag} onChange={(e) => setNag(e.target.value as any)} className="w-full min-h-[46px] p-3 border border-border bg-surface-2 rounded-sm text-[13.5px] outline-none focus:border-brand focus:bg-surface"><option value="off">Off — no reminders</option><option value="gentle">Gentle — once a day</option><option value="normal">Normal — morning and evening</option><option value="relentless">Relentless — every 3 hours</option></select><p className="ml-px text-[11.5px] text-text-3">Quiet hours (10 pm – 7 am) always apply unless you choose Relentless.</p></div>
        <div className="grid gap-1.5"><label className="block ml-px text-text-2 text-[11px] font-bold uppercase tracking-[0.08em]">Notes <span className="text-text-3 font-semibold normal-case tracking-normal">optional</span></label><textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Context, a link, or the reason you saved it…" className="w-full min-h-[84px] p-3 border border-border bg-surface-2 rounded-sm text-[13.5px] leading-[1.5] outline-none focus:border-brand focus:bg-surface focus:shadow-[0_0_0_3px_var(--brand-tint)] resize-y" /></div>
      </form>
    </BottomSheet>
  );
}

export function ShareSheet({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (data: { intent: string; reminder: string; note: string }) => void }) {
  const [intent, setIntent] = useState("watch");
  const [reminder, setReminder] = useState("tomorrow");
  const [note, setNote] = useState("");
  return (
    <BottomSheet open={open} onClose={onClose} title="Save from another app" subtitle="Shared two seconds ago" footer={<Button variant="primary" grow onClick={() => { onSave({ intent, reminder, note }); onClose(); }}>Save to Watch later</Button>}>
      <div className="flex gap-3 items-center p-2.5 bg-surface border border-border rounded-md">
        <span className="relative w-16 h-12 rounded-sm shrink-0 overflow-hidden bg-gradient-to-br from-[#F2B58C] to-[#6B5BDB] grid place-items-center text-white"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M9 7.5 17 12l-8 4.5v-9Z" /></svg><span className="absolute right-1 bottom-1 bg-[rgba(9,12,24,.72)] text-white text-[9.5px] font-bold px-1 py-0.5 rounded-[4px] num">6:04</span></span>
        <span className="min-w-0 flex-1"><strong className="block text-[13.5px] font-semibold">5-minute pasta recipe</strong><span className="block mt-1 text-text-3 text-[11.5px]">Instagram Reel · Alex&apos;s Kitchen</span></span>
      </div>
      <div className="grid gap-4 mt-5">
        <div className="grid gap-1.5"><label className="block ml-px text-text-2 text-[11px] font-bold uppercase tracking-[0.08em]">What should this become?</label><select value={intent} onChange={(e) => setIntent(e.target.value)} className="w-full min-h-[46px] p-3 border border-border bg-surface-2 rounded-sm"><option value="watch">Watch later</option><option value="task">A task</option><option value="note">A note</option></select></div>
        <div className="grid gap-1.5"><span className="block ml-px text-text-2 text-[11px] font-bold uppercase tracking-[0.08em]">Remind me</span><div className="grid grid-cols-3 gap-2">{["tonight", "tomorrow", "weekend"].map((r) => <button key={r} onClick={() => setReminder(r)} aria-pressed={reminder === r} className={`min-h-11 px-2 border rounded-sm text-[12.5px] font-bold transition-colors ${reminder === r ? "bg-brand-tint border-brand/30 text-brand" : "bg-surface border-border text-text-2 hover:border-border-strong"}`}>{r[0].toUpperCase() + r.slice(1)}</button>)}</div></div>
        <div className="grid gap-1.5"><label className="block ml-px text-text-2 text-[11px] font-bold uppercase tracking-[0.08em]">Why did you save this? <span className="text-text-3 font-semibold normal-case tracking-normal">optional</span></label><textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Try this for Sunday dinner…" className="w-full min-h-[84px] p-3 border border-border bg-surface-2 rounded-sm text-[13.5px]" /></div>
      </div>
    </BottomSheet>
  );
}

export function InsightsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Productivity insights" subtitle="This week · 14–20 September">
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[{ b: "12", s: "completed this week" }, { b: "78%", s: "completion rate" }, { b: "2.4 days", s: "average time open" }, { b: "3", s: "carried over" }].map((m) => <div key={m.s} className="p-3 border border-border bg-surface rounded-md shadow-e1"><b className="block text-[20px] font-bold tracking-[-0.02em] leading-none">{m.b}</b><span className="block mt-1.5 text-text-3 text-[11.5px] font-medium">{m.s}</span></div>)}
      </div>
      <p className="text-text-3 text-[11px] font-bold uppercase tracking-[0.08em] mb-2">Completed by day</p>
      <div className="flex items-end gap-2 h-[104px] pt-3 border-b border-border">
        {[34, 52, 76, 92, 58, 23, 42].map((h, i) => <div key={i} className="flex-1 h-full flex flex-col items-center justify-end gap-1.5"><span className={`w-full max-w-5 rounded-t-[6px] min-h-[6px] ${i === 4 ? "bg-brand" : "bg-brand-tint-2"} transition-all`} style={{ height: `${h}%` }} /><span className="text-text-3 text-[10.5px] font-semibold">{["M", "T", "W", "T", "F", "S", "S"][i]}</span></div>)}
      </div>
      <p className="mt-3 text-text-2 text-[12.5px] leading-[1.55]">Thursday is your strongest day. You finish short tasks in the evening, so evening nudges are working — you have 5 saved videos older than a week, and a 20-minute watch session would clear the queue.</p>
    </BottomSheet>
  );
}

export function NudgeSheet({ open, onClose, title, body, onAction }: { open: boolean; onClose: () => void; title: string; body: string; onAction: (a: "done" | "snooze" | "drop") => void }) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Your nudges" subtitle="Exactly what lands on your phone">
      <div className="border border-border rounded-md p-4 bg-surface-2 shadow-e1">
        <div className="flex items-center gap-2"><span className="w-[26px] h-[26px] rounded-[8px] bg-gradient-to-br from-[#5B52E8] to-[#4338CA] text-white grid place-items-center"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 4v16M4 12h16" /></svg></span><strong className="text-[12.5px] font-semibold">Personal OS</strong><time className="ml-auto text-text-3 text-[11px]">now</time></div>
        <h3 className="mt-3 text-[14px] font-semibold tracking-[-0.01em]">{title}</h3>
        <p className="mt-1 text-text-2 text-[12.5px]">{body}</p>
        <div className="grid grid-cols-3 gap-px mt-4 bg-border border border-border rounded-sm overflow-hidden">
          <button onClick={() => { onAction("done"); onClose(); }} className="min-h-11 bg-surface text-[12.5px] font-bold text-done-fg flex items-center justify-center gap-1 hover:bg-surface-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="m5.5 12.5 4.2 4.2L18.5 7.8" strokeLinecap="round" strokeLinejoin="round" /></svg>Done</button>
          <button onClick={() => { onAction("snooze"); onClose(); }} className="min-h-11 bg-surface text-[12.5px] font-bold text-brand flex items-center justify-center gap-1 hover:bg-surface-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="8.2" /><path d="M12 7.5V12l3 2" strokeLinecap="round" /></svg>Snooze</button>
          <button onClick={() => { onAction("drop"); onClose(); }} className="min-h-11 bg-surface text-[12.5px] font-bold text-danger-fg flex items-center justify-center gap-1 hover:bg-surface-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="m6.5 6.5 11 11M17.5 6.5l-11 11" strokeLinecap="round" /></svg>Drop</button>
        </div>
      </div>
      <p className="mt-4 text-text-2 text-[12.5px] leading-[1.55]">Nudges are intentionally calm: one clear ask, three ways out. Nothing is deleted without a way back — every action here can be undone for a few seconds.</p>
    </BottomSheet>
  );
}

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [pushOn, setPushOn] = useState(true);
  return (
    <BottomSheet open={open} onClose={onClose} title="Settings" subtitle="Tune how the OS talks to you" footer={<Button variant="primary" grow onClick={onClose}>Save settings</Button>}>
      <p className="text-text-3 text-[11px] font-bold uppercase tracking-[0.08em] mb-2 ml-0.5">Appearance</p>
      <div className="bg-surface border border-border rounded-md overflow-hidden shadow-e1 mb-5">
        <div className="flex items-center gap-3 p-3 min-h-[60px]"><span className="w-[34px] h-[34px] rounded-sm bg-surface-3 text-text-2 grid place-items-center"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="12" r="4.2" /><path d="M12 2.8v2.4M12 18.8v2.4M4.5 4.5l1.7 1.7M17.8 17.8l1.7 1.7M2.8 12h2.4M18.8 12h2.4M4.5 19.5l1.7-1.7M17.8 6.2l1.7-1.7" strokeLinecap="round" /></svg></span><span className="min-w-0 flex-1"><strong className="block text-[13.5px] font-semibold">Theme</strong><span className="block mt-0.5 text-text-3 text-[11.5px]">{theme === "system" ? "System — follows your device setting" : theme === "dark" ? "Dark — warmer contrast for evenings" : "Light — easy on the eyes during the day"}</span></span></div>
        <div className="p-3 pt-0"><div className="grid grid-cols-3 gap-2 w-full">{["system", "light", "dark"].map((t) => <button key={t} onClick={() => setTheme(t as any)} aria-pressed={theme === t} className={`min-h-11 px-2 border rounded-sm text-[12.5px] font-bold capitalize transition-colors ${theme === t ? "bg-brand-tint border-brand/30 text-brand" : "bg-surface border-border text-text-2 hover:border-border-strong"}`}>{t}</button>)}</div></div>
      </div>

      <p className="text-text-3 text-[11px] font-bold uppercase tracking-[0.08em] mb-2 ml-0.5">Reminders</p>
      <div className="bg-surface border border-border rounded-md overflow-hidden shadow-e1 mb-5">
        <div className="flex items-center gap-3 p-3 min-h-[60px] border-b border-border"><span className="w-[34px] h-[34px] rounded-sm bg-surface-3 text-text-2 grid place-items-center"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.3 3.6 8.5S14.4 18.1 12 20.5c-2.4-2.4-3.6-5.3-3.6-8.5S9.6 5.9 12 3.5Z" strokeLinecap="round" /></svg></span><span className="min-w-0 flex-1"><strong className="block text-[13.5px] font-semibold">Timezone</strong><span className="block mt-0.5 text-text-3 text-[11.5px]">Pacific/Auckland · all reminders use this</span></span></div>
        <div className="flex items-center gap-3 p-3 min-h-[60px] border-b border-border"><span className="w-[34px] h-[34px] rounded-sm bg-surface-3 text-text-2 grid place-items-center"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M12 4.5 13.5 9l4.5 1.5L13.5 12 12 16.5 10.5 12 6 10.5 10.5 9 12 4.5Z" /></svg></span><span className="min-w-0 flex-1"><strong className="block text-[13.5px] font-semibold">Quiet hours</strong><span className="block mt-0.5 text-text-3 text-[11.5px]">10:00 pm – 7:00 am · Relentless items can override</span></span></div>
        <div className="flex items-center gap-3 p-3 min-h-[60px]"><span className="w-[34px] h-[34px] rounded-sm bg-surface-3 text-text-2 grid place-items-center"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M18 9a6 6 0 1 0-12 0c0 6.5-2.5 6.5-2.5 8.5h17C20.5 15.5 18 15.5 18 9Z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></svg></span><span className="min-w-0 flex-1"><strong className="block text-[13.5px] font-semibold">Push and email nudges</strong><span className="block mt-0.5 text-text-3 text-[11.5px]">{pushOn ? "On · delivered to this device" : "Off · you will only see items in the app"}</span></span><button role="switch" aria-checked={pushOn} onClick={() => { setPushOn(!pushOn); toast(pushOn ? "Push nudges paused" : "Push nudges on"); }} className="w-[60px] min-h-11 flex items-center justify-end"><span className={`relative w-12 h-7 rounded-full transition-colors ${pushOn ? "bg-brand" : "bg-border-strong"}`}><b className={`absolute top-[3px] left-[3px] w-[22px] h-[22px] rounded-full bg-white shadow-[0_1px_3px_rgba(9,12,24,.28)] transition-transform ${pushOn ? "translate-x-5" : ""}`} /></span></button></div>
      </div>
      <p className="text-text-2 text-[12.5px] leading-[1.55]">Relentless nudge policy sends one reminder every three hours for a single item. Everything else stays on the gentle default.</p>
    </BottomSheet>
  );
}

export function ConnectionsSheet({ open, onClose, google, gmail, onToggleGoogle, onToggleGmail }: { open: boolean; onClose: () => void; google: boolean; gmail: boolean; onToggleGoogle: () => void; onToggleGmail: () => void }) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Connections" subtitle="Bring your real schedule in">
      <div className="bg-surface border border-border rounded-md overflow-hidden shadow-e1 mb-4">
        <div className="flex items-center gap-3 p-3 min-h-[60px] border-b border-border"><span className="w-[34px] h-[34px] rounded-sm bg-surface-3 text-text-2 grid place-items-center">📅</span><span className="min-w-0 flex-1"><strong className="block text-[13.5px] font-semibold">Google Calendar</strong><span className="block mt-0.5 text-text-3 text-[11.5px]">{google ? "Connected · read-only · 2 events this week" : "Read-only events — reminders stay in your control"}</span></span><Button variant="secondary" size="sm" onClick={onToggleGoogle}>{google ? "Disconnect" : "Connect"}</Button></div>
        <div className="flex items-center gap-3 p-3 min-h-[60px]"><span className="w-[34px] h-[34px] rounded-sm bg-surface-3 text-text-2 grid place-items-center">📄</span><span className="min-w-0 flex-1"><strong className="block text-[13.5px] font-semibold">Gmail event detection</strong><span className="block mt-0.5 text-text-3 text-[11.5px]">Finds travel, appointments and invitations. Never stores email bodies.</span></span><button role="switch" aria-checked={gmail} onClick={onToggleGmail} className="w-[60px] min-h-11 flex items-center justify-end"><span className={`relative w-12 h-7 rounded-full transition-colors ${gmail ? "bg-brand" : "bg-border-strong"}`}><b className={`absolute top-[3px] left-[3px] w-[22px] h-[22px] rounded-full bg-white shadow-[0_1px_3px_rgba(9,12,24,.28)] transition-transform ${gmail ? "translate-x-5" : ""}`} /></span></button></div>
      </div>
      <div className="text-text-2 text-[12.5px] leading-[1.55]"><strong className="text-text-1">Privacy first.</strong> Google Calendar is the recommended first connection. Gmail scanning is optional and extracts event details only — you can disconnect at any time and the extracted data is deleted with it.</div>
    </BottomSheet>
  );
}

export function ProfileSheet({ open, onClose, openCount, overdue }: { open: boolean; onClose: () => void; openCount: number; overdue: number }) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Alex's OS" subtitle="Synced just now" footer={<Button variant="primary" grow onClick={onClose}>Done</Button>}>
      <div className="bg-surface border border-border rounded-md overflow-hidden shadow-e1">
        <div className="flex items-center gap-3 p-3 min-h-[60px] border-b border-border"><span className="w-[34px] h-[34px] rounded-sm bg-surface-3 text-text-2 grid place-items-center"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="m5.5 12.5 4.2 4.2L18.5 7.8" strokeLinecap="round" strokeLinejoin="round" /></svg></span><span className="min-w-0 flex-1"><strong className="block text-[13.5px] font-semibold">Everything is synced</strong><span className="block mt-0.5 text-text-3 text-[11.5px]">alex@example.com · push and email nudges on · Pacific/Auckland</span></span></div>
        <div className="flex items-center gap-3 p-3 min-h-[60px] border-b border-border"><span className="w-[34px] h-[34px] rounded-sm bg-surface-3 text-text-2 grid place-items-center"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M9 6.5h11M9 12h11M9 17.5h11" /></svg></span><span className="min-w-0 flex-1"><strong className="block text-[13.5px] font-semibold">Open loops</strong><span className="block mt-0.5 text-text-3 text-[11.5px]">{openCount} open · {overdue} overdue</span></span></div>
        <div className="flex items-center gap-3 p-3 min-h-[60px]"><span className="w-[34px] h-[34px] rounded-sm bg-surface-3 text-text-2 grid place-items-center"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M2.8 12S6.4 5.8 12 5.8 21.2 12 21.2 12 17.6 18.2 12 18.2 2.8 12 2.8 12Z" /><circle cx="12" cy="12" r="3" /></svg></span><span className="min-w-0 flex-1"><strong className="block text-[13.5px] font-semibold">What I keep</strong><span className="block mt-0.5 text-text-3 text-[11.5px]">Only the items you captured, plus connected calendar events.</span></span></div>
      </div>
    </BottomSheet>
  );
}
