"use client";
import { ChatMessage } from "@/lib/types";
import { Chip } from "@/components/ui/Chip";

export function MessageList({ messages, onView, onUndo }: { messages: ChatMessage[]; onView: (id: string) => void; onUndo: (id: string) => void }) {
  return (
    <div className="grid gap-3 my-5">
      {messages.map((m) => (
        <div key={m.id} className={`animate-[msgIn_180ms_ease] ${m.role === "user" ? "justify-items-end" : ""}`}>
          <div className={`max-w-[85%] p-3 rounded-md text-[13px] leading-[1.5] shadow-e1 ${m.role === "assistant" ? "bg-surface border border-border rounded-bl-[5px] text-text-2" : "bg-brand text-on-brand rounded-br-[5px] shadow-brand ml-auto"}`}>
            {m.text === "typing" ? (
              <span className="inline-flex gap-1 items-center h-3.5"><i className="w-1.5 h-1.5 rounded-full bg-text-3 animate-[bounce_1s_infinite]" /><i className="w-1.5 h-1.5 rounded-full bg-text-3 animate-[bounce_1s_infinite_0.12s]" /><i className="w-1.5 h-1.5 rounded-full bg-text-3 animate-[bounce_1s_infinite_0.24s]" /></span>
            ) : (
              m.text
            )}
            {m.receipt && (
              <div className="mt-3 p-3 rounded-sm bg-surface-2 border border-border">
                <div className="flex items-center gap-1.5 flex-wrap"><Chip variant={m.receipt.type}>{m.receipt.type}</Chip><span className="text-text-3 text-[11px] font-bold uppercase">Added to Now</span></div>
                <strong className="block mt-2 text-[13.5px] font-semibold text-text-1">{m.receipt.title}</strong>
                <dl className="mt-3 grid gap-1.5 text-[11.5px]"><div className="flex justify-between gap-3"><dt className="text-text-3 font-medium">When</dt><dd className="m-0 text-text-1 font-semibold text-right">{m.receipt.when}</dd></div><div className="flex justify-between gap-3"><dt className="text-text-3 font-medium">Nudges</dt><dd className="m-0 text-text-1 font-semibold text-right">{m.receipt.nag}</dd></div></dl>
                <div className="flex gap-2 mt-3"><button onClick={() => onView(m.receipt!.id)} className="min-h-11 px-3 rounded-sm bg-surface border border-border text-text-2 text-[12.5px] font-semibold">View item</button><button onClick={() => onUndo(m.receipt!.id)} className="min-h-11 px-3 rounded-sm bg-transparent text-text-2 text-[12.5px] font-semibold">Undo</button></div>
              </div>
            )}
            {m.time && <time className="block mt-1.5 text-[10.5px] text-text-3 font-medium">{m.time}</time>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SuggestionChips({ onPick }: { onPick: (text: string) => void }) {
  const suggs = [
    { text: "Buy oat milk and bananas", label: "Buy groceries", hint: "sorts into Groceries" },
    { text: "Remind me to call the dentist tomorrow at 2pm", label: "Add a task", hint: "creates a reminder" },
    { text: "https://example.com/designing-calm-software", label: "Save a link", hint: "queues it for later" },
  ];
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 -mx-5 px-5">
      {suggs.map((s) => (
        <button key={s.label} onClick={() => onPick(s.text)} className="inline-flex flex-col items-start gap-0.5 min-h-11 px-3 py-2 bg-surface border border-border rounded-sm text-text-2 whitespace-nowrap hover:border-brand hover:text-brand transition-colors shrink-0">
          <b className="text-[12.5px] font-semibold">{s.label}</b><small className="text-[10.5px] text-text-3">{s.hint}</small>
        </button>
      ))}
    </div>
  );
}

export function ChatComposer({ value, onChange, onSend }: { value: string; onChange: (v: string) => void; onSend: () => void }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSend(); }} className="flex items-end gap-2 p-2 bg-surface border border-border rounded-md shadow-e1 focus-within:border-brand focus-within:shadow-[0_0_0_3px_var(--brand-tint)] transition-all">
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={1} placeholder="Tell me anything…" className="flex-1 min-h-[38px] max-h-[104px] p-2 bg-transparent outline-none text-[13.5px] leading-[1.45] resize-none placeholder:text-text-3" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }} />
      <button type="submit" aria-label="Send message" aria-disabled={!value.trim()} className={`w-10 h-10 rounded-sm grid place-items-center transition-colors ${value.trim() ? "bg-brand text-on-brand hover:bg-brand-hover" : "bg-surface-3 text-text-3 pointer-events-none"}`}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 4.5 20 12l-15.5 7.5L7 12 4.5 4.5ZM7 12h13" /></svg>
      </button>
    </form>
  );
}
