"use client";
import { useState, useCallback } from "react";
import { AppShell } from "./AppShell";
import { EditorSheet, ShareSheet, InsightsSheet, NudgeSheet, SettingsSheet, ConnectionsSheet, ProfileSheet } from "@/components/sheets/Sheets";
import { useItemsStore } from "@/hooks/useItemsStore";
import { useToast } from "@/hooks/useToast";
import { Item } from "@/lib/types";
import { fromNow, dueLabel } from "@/lib/utils";

type SheetId = "editorSheet" | "shareSheet" | "insightsSheet" | "nudgeSheet" | "settingsSheet" | "connectionsSheet" | "profileSheet" | null;

export function GlobalShell({ children }: { children: React.ReactNode }) {
  const { items, stats, now, google, gmail, setGoogle, setGmail, addItem, updateItem, deleteItem, doneItem, dropItem, snoozeItem } = useItemsStore();
  const { toast } = useToast();
  const [activeSheet, setActiveSheet] = useState<SheetId>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editingKey, setEditingKey] = useState(0);

  const openSheet = useCallback((id: string, payload?: any) => {
    if (id === "editorSheet") {
      if (payload?.id) {
        const found = items.find((i) => i.id === payload.id) || null;
        setEditingItem(found);
      } else {
        setEditingItem(null);
      }
      setEditingKey((k) => k + 1);
    }
    setActiveSheet(id as SheetId);
  }, [items]);

  const closeSheet = useCallback(() => {
    setActiveSheet(null);
    setEditingItem(null);
  }, []);

  const handleSave = (data: Partial<Item> & { id?: string }) => {
    if (data.id) {
      const prev = items.find((i) => i.id === data.id);
      updateItem(data.id, data);
      toast("Item updated", prev ? () => updateItem(data.id!, prev) : undefined);
    } else {
      const created = addItem(data);
      toast("Captured. I will keep it in view.", () => deleteItem(created.id));
    }
  };

  const handleShareSave = ({ intent, reminder, note }: { intent: string; reminder: string; note: string }) => {
    const offsets: Record<string, number> = { tonight: 14, tomorrow: 33, weekend: 60 };
    const due = new Date(now.getTime() + (offsets[reminder] || 33) * 3600000).toISOString();
    const created = addItem({ title: "5-minute pasta recipe", item_type: intent as any, due_at: due, nag_policy: "gentle", body: note || "Instagram · Alex's Kitchen", extra: { url: "https://instagram.com/reel/xyz" } } as any);
    toast("Saved to Watch later", () => deleteItem(created.id));
  };

  const focusItem = items.filter((i) => i.status === "open").sort((a, b) => (a.due_at ? new Date(a.due_at).getTime() : Infinity) - (b.due_at ? new Date(b.due_at).getTime() : Infinity))[0] || null;

  const handleNudgeAction = (action: "done" | "snooze" | "drop") => {
    if (!focusItem) return;
    if (action === "done") { doneItem(focusItem.id); toast("Marked done — nice work.", () => updateItem(focusItem.id, { status: "open" })); }
    if (action === "drop") { const prev = focusItem.status; dropItem(focusItem.id); toast("Dropped. It will not nudge you again.", () => updateItem(focusItem.id, { status: prev })); }
    if (action === "snooze") { const prev = focusItem.due_at; const next = new Date(now.getTime() + 60 * 60 * 1000).toISOString(); snoozeItem(focusItem.id, next); toast(`Snoozed until ${dueLabel(next, now)}`, () => updateItem(focusItem.id, { due_at: prev })); }
  };

  return (
    <>
      <AppShell openCount={stats.open} onOpenSheet={openSheet}>
        {children}
      </AppShell>

      <EditorSheet
        key={editingKey}
        open={activeSheet === "editorSheet"}
        onClose={closeSheet}
        item={editingItem}
        onSave={handleSave}
        onDelete={(id) => { deleteItem(id); toast("Dropped. It will not nudge you again.", () => addItem(items.find((i) => i.id === id) || { title: "Restored" })); }}
      />
      <ShareSheet open={activeSheet === "shareSheet"} onClose={closeSheet} onSave={handleShareSave} />
      <InsightsSheet open={activeSheet === "insightsSheet"} onClose={closeSheet} />
      <NudgeSheet
        open={activeSheet === "nudgeSheet"}
        onClose={closeSheet}
        title={focusItem ? focusItem.title : "You are all clear"}
        body={focusItem ? (new Date(focusItem.due_at || "") < now ? `Still open since ${dueLabel(focusItem.due_at, now).toLowerCase()}. Two minutes now saves a follow-up later.` : `Due ${dueLabel(focusItem.due_at, now).toLowerCase()}. A small step now keeps tomorrow light.`) : "Nothing is open. New captures will show up here."}
        onAction={handleNudgeAction}
      />
      <SettingsSheet open={activeSheet === "settingsSheet"} onClose={closeSheet} />
      <ConnectionsSheet open={activeSheet === "connectionsSheet"} onClose={closeSheet} google={google} gmail={gmail} onToggleGoogle={() => { setGoogle(!google); toast(google ? "Google Calendar disconnected" : "Google Calendar connected"); }} onToggleGmail={() => { setGmail(!gmail); toast(gmail ? "Gmail event detection paused" : "Gmail event detection on"); }} />
      <ProfileSheet open={activeSheet === "profileSheet"} onClose={closeSheet} openCount={stats.open} overdue={stats.overdue} />
    </>
  );
}
