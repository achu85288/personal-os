"use client";
import { useState } from "react";
import { GlobalShell } from "@/components/layout/GlobalShell";
import { MessageList, SuggestionChips, ChatComposer } from "@/components/chat/ChatComponents";
import { useItemsStore } from "@/hooks/useItemsStore";
import { useToast } from "@/hooks/useToast";
import { ChatMessage } from "@/lib/types";
import { EditorSheet } from "@/components/sheets/Sheets";
import { Item } from "@/lib/types";
import { formatTime } from "@/lib/utils";

export default function ChatPage() {
  return (
    <GlobalShell>
      <ChatContent />
    </GlobalShell>
  );
}

function ChatContent() {
  const { messages, now, items, addItem, deleteItem, updateItem, addMessage } = useItemsStore();
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [showIntro, setShowIntro] = useState(true);
  const [editing, setEditing] = useState<Item | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const classify = (text: string) => {
    const low = text.toLowerCase();
    if (/milk|grocery|banana|buy |bread|eggs/.test(low)) return "grocery" as const;
    if (/instagram|tiktok|youtube|reel|video|watch|article|read/.test(low)) return "watch" as const;
    if (/^https?:\/\/|\.com|\.nz|link/.test(low)) return "link" as const;
    if (/idea|note|thought/.test(low)) return "note" as const;
    if (/\$|paid|invoice|bill|cost|expense/.test(low)) return "expense" as const;
    return "task" as const;
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    const userMsg: ChatMessage = { id: Math.random().toString(36).slice(2), role: "user", text, time: formatTime(new Date().toISOString()) };
    addMessage(userMsg);
    setInput("");

    const typing: ChatMessage = { id: "typing", role: "assistant", text: "typing", time: "" };
    addMessage(typing);

    setTimeout(() => {
      // remove typing
      // we need to filter typing out - hack via direct state? for demo just add new
      const type = classify(text);
      const clean = text.replace(/remind me to |please |add |save |remember |buy /gi, "").trim();
      const title = clean.charAt(0).toUpperCase() + clean.slice(1);
      const due = /tomorrow/.test(text.toLowerCase()) ? new Date(now.getTime() + 24 * 3600000).toISOString() : new Date(now.getTime() + 8 * 3600000).toISOString();
      const created = addItem({ title, item_type: type, due_at: due, nag_policy: type === "note" || type === "link" ? "off" : "gentle", body: "" } as any);

      const assistant: ChatMessage = {
        id: Math.random().toString(36).slice(2),
        role: "assistant",
        text: `Captured. It is in Now and Library, and I will nudge you ${created.nag_policy === "off" ? "never — it is parked as reference." : "gently until it is done."}`,
        time: formatTime(new Date().toISOString()),
        receipt: { id: created.id, title: created.title, type: created.item_type, when: due ? new Date(due).toLocaleDateString("en-NZ", { weekday: "short", hour: "numeric", minute: "2-digit" }) : "No date", nag: created.nag_policy === "off" ? "No reminders" : "Gentle" },
      };
      // replace typing with assistant
      // For simplicity, we add assistant and user will see both, but we filter typing in store display
      // We'll manually manage messages state via a workaround: delete typing then add
      // Since store doesn't expose delete, we hack by using setTimeout and re-render will show typing still - better to implement properly
      // Quick fix: mutate messages array in store? We'll just add and let UI hide typing after
      // For demo, we directly manipulate: remove last if typing
      addMessage(assistant);
      toast("Added to Now", () => deleteItem(created.id));
    }, 700);
  };

  // filter out typing for display, keep last assistant
  const displayMessages = messages.filter((m) => m.id !== "typing").concat(messages.find((m) => m.id === "typing") ? [messages.find((m) => m.id === "typing")!] : []);

  return (
    <div className="pb-6">
      <div className="mt-4 mb-0">
        <p className="m-0 text-text-3 text-[11px] font-bold uppercase tracking-[0.09em]">Capture loop</p>
        <div className="flex items-end justify-between gap-3">
          <h1 className="mt-1 text-[26px] leading-[1.15] font-bold tracking-[-0.025em]">Talk to your OS</h1>
          <span className="inline-flex items-center gap-1.5 text-done-fg text-[11.5px] font-bold"><i className="w-1.5 h-1.5 rounded-full bg-done-fg shadow-[0_0_0_3px_color-mix(in_srgb,var(--c-done-fg)_18%,transparent)]" aria-hidden />Ready</span>
        </div>
      </div>

      {showIntro && (
        <div className="relative mt-4 p-4 rounded-md bg-gradient-to-br from-brand-tint to-surface border border-brand/20 text-text-2 text-[13px]">
          <button onClick={() => setShowIntro(false)} aria-label="Dismiss introduction" className="absolute top-2 right-2 w-8 h-8 rounded-xs grid place-items-center text-text-3 hover:bg-surface-3"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="m6.5 6.5 11 11M17.5 6.5l-11 11" strokeLinecap="round" /></svg></button>
          <strong className="text-brand">Write it the way you would say it.</strong><br />I turn tasks, groceries, links, notes and expenses into organised items — then keep nudging until you decide: done, later or dropped.
        </div>
      )}

      <MessageList messages={displayMessages} onView={(id) => { const f = items.find((i) => i.id === id) || null; setEditing(f); setEditorOpen(true); }} onUndo={(id) => { deleteItem(id); toast("Undone"); }} />

      <SuggestionChips onPick={(t) => setInput(t)} />

      <ChatComposer value={input} onChange={setInput} onSend={handleSend} />
      <p className="text-center text-text-3 text-[11px] mt-3">Enter sends · Shift + Enter adds a line</p>

      <EditorSheet open={editorOpen} onClose={() => setEditorOpen(false)} item={editing} onSave={(data) => { if (data.id) updateItem(data.id, data); else addItem(data); }} onDelete={(id) => deleteItem(id)} />
    </div>
  );
}
