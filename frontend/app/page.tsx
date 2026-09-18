"use client";
import { GlobalShell } from "@/components/layout/GlobalShell";
import { CaptureBar } from "@/components/capture/CaptureBar";
import { Greeting } from "@/components/now/Greeting";
import { StatsStrip } from "@/components/now/StatsStrip";
import { FocusCard } from "@/components/now/FocusCard";
import { ItemRow, WatchRow } from "@/components/now/ItemRow";
import { useItemsStore } from "@/hooks/useItemsStore";
import { useToast } from "@/hooks/useToast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EditorSheet, ShareSheet } from "@/components/sheets/Sheets";
import { Item } from "@/lib/types";

export default function NowPage() {
  return (
    <GlobalShell>
      <NowContent />
    </GlobalShell>
  );
}

function NowContent() {
  const { items, externalEvents, now, stats, google, gmail, addItem, deleteItem, updateItem, doneItem, dropItem, snoozeItem } = useItemsStore();
  const { toast } = useToast();
  const router = useRouter();
  const [editorOpen, setEditorOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);

  const openItems = items.filter((i) => i.status === "open").sort((a, b) => (a.due_at ? new Date(a.due_at).getTime() : Infinity) - (b.due_at ? new Date(b.due_at).getTime() : Infinity));
  const focus = openItems[0] || null;
  const coming = openItems.filter((i) => i.item_type !== "watch" && i.id !== focus?.id).slice(0, 3);
  const watch = openItems.filter((i) => i.item_type === "watch");

  const handleDone = (id: string) => {
    const prev = items.find((i) => i.id === id);
    doneItem(id);
    toast("Marked done — nice work.", prev ? () => updateItem(id, { status: prev.status }) : undefined);
  };

  const handleOpen = (id: string) => {
    const found = items.find((i) => i.id === id) || null;
    setEditing(found);
    setEditorOpen(true);
  };

  const external = google ? externalEvents.filter((e) => e.source !== "Gmail detected" || gmail).filter((e) => new Date(e.start) >= now).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0] : null;

  return (
    <div className="pb-6">
      <Greeting overdue={stats.overdue} today={stats.today} open={stats.open} />

      <CaptureBar onCapture={() => { setEditing(null); setEditorOpen(true); }} onVoice={() => toast("Voice capture listens for 5 seconds")} onShare={() => setShareOpen(true)} />

      <StatsStrip stats={stats} onSelect={(lens) => { router.push(`/library?lens=${lens}`); }} />

      <div className="mt-6">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div><h2 className="m-0 text-[15px] font-semibold tracking-[-0.01em]">Next up</h2><p className="mt-0.5 text-text-3 text-[12px] font-medium">{focus ? (new Date(focus.due_at || "") < now ? "Overdue — clear this first" : "Your most urgent open loop") : ""}</p></div>
          {focus && <button onClick={() => handleOpen(focus.id)} className="min-h-11 min-w-11 px-1 text-brand text-[12.5px] font-bold">Edit</button>}
        </div>
        <FocusCard item={focus} now={now} onDone={handleDone} onSnooze={(id) => { const next = new Date(now.getTime() + 60 * 60 * 1000).toISOString(); snoozeItem(id, next); toast(`Snoozed for an hour`); }} onOpen={handleOpen} />
      </div>

      {external && (
        <div className="mt-6">
          <div className="flex items-center justify-between gap-3 mb-3"><div><h2 className="m-0 text-[15px] font-semibold">From your calendar</h2><p className="mt-0.5 text-text-3 text-[12px]">Read-only · Google</p></div><button onClick={() => router.push("/calendar")} className="min-h-11 px-1 text-brand text-[12.5px] font-bold">Manage</button></div>
          <div className="flex gap-3 items-stretch p-3 bg-surface border border-border rounded-md shadow-e1">
            <time className="w-14 text-text-2 text-[11.5px] font-bold pt-0.5 num">{new Date(external.start).toLocaleTimeString("en-NZ", { hour: "numeric", minute: "2-digit" })}</time>
            <span className="w-[3px] rounded-full bg-info-fg shrink-0" aria-hidden />
            <span className="min-w-0 flex-1"><strong className="block text-[13.5px] font-semibold">{external.title}</strong><span className="block mt-1 text-text-3 text-[11.5px]">{external.duration} · {external.source}</span></span>
          </div>
        </div>
      )}

      <div className="mt-6">
        <div className="flex items-center justify-between gap-3 mb-3"><div><h2 className="m-0 text-[15px] font-semibold">Coming up</h2><p className="mt-0.5 text-text-3 text-[12px]">{coming.length} of {Math.max(0, openItems.filter((i) => i.item_type !== "watch").length - 1)} shown</p></div><button onClick={() => router.push("/library")} className="min-h-11 px-1 text-brand text-[12.5px] font-bold inline-flex items-center gap-1">See all<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="m9.5 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg></button></div>
        <div className="grid gap-2">
          {coming.length ? coming.map((it) => <ItemRow key={it.id} item={it} now={now} onOpen={handleOpen} onDone={handleDone} />) : <div className="text-center py-6 px-5 bg-surface border border-border rounded-md shadow-e1"><h3 className="m-0 text-[14px] font-semibold">Nothing else queued</h3><p className="mt-1.5 text-text-2 text-[12.5px]">Capture something and it will show up here.</p></div>}
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between gap-3 mb-3"><div><h2 className="m-0 text-[15px] font-semibold">Watch later</h2><p className="mt-0.5 text-text-3 text-[12px]">{watch.length ? `${watch.length} saved · oldest ${watch.length ? "a few days ago" : ""}` : ""}</p></div><button onClick={() => router.push("/library?type=watch")} className="min-h-11 px-1 text-brand text-[12.5px] font-bold inline-flex items-center gap-1">See queue<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="m9.5 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg></button></div>
        <div className="grid gap-2">
          {watch.length ? watch.map((it) => <WatchRow key={it.id} item={it} onOpen={handleOpen} />) : <div className="text-center py-6 px-5 bg-surface border border-border rounded-md shadow-e1"><h3 className="m-0 text-[14px] font-semibold">Queue is empty</h3><p className="mt-1.5 text-text-2 text-[12.5px]">Share a video or article and it will wait here for a quiet moment.</p></div>}
        </div>
      </div>

      {/* local sheets for quick capture */}
      <EditorSheet open={editorOpen} onClose={() => setEditorOpen(false)} item={editing} onSave={(data) => { if (data.id) updateItem(data.id, data); else addItem(data); }} onDelete={(id) => deleteItem(id)} />
      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} onSave={({ intent, reminder, note }) => {
        const offsets: Record<string, number> = { tonight: 14, tomorrow: 33, weekend: 60 };
        const due = new Date(now.getTime() + (offsets[reminder] || 33) * 3600000).toISOString();
        addItem({ title: "5-minute pasta recipe", item_type: intent as any, due_at: due, nag_policy: "gentle", body: note || "Instagram · Alex's Kitchen" } as any);
        toast("Saved to Watch later");
      }} />
    </div>
  );
}
