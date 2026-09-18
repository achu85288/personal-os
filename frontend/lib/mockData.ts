import { Item, ExternalEvent, ChatMessage } from "./types";

// Fixed "now" for demo consistency — Friday 18 Sep 2026 09:41 NZ
export const DEMO_NOW = new Date(2026, 8, 18, 9, 41);

function at(days: number, h = 9, m = 0): string {
  const d = new Date(DEMO_NOW.getFullYear(), DEMO_NOW.getMonth(), DEMO_NOW.getDate() + days, h, m, 0, 0);
  return d.toISOString();
}

export const mockItems: Item[] = [
  { id: "1", title: "Pay the broadband bill", item_type: "expense", due_at: at(-1, 17, 0), nag_policy: "normal", body: "Reference 4417-K. Auto-pay is off since the card changed.", status: "open", extra: {} },
  { id: "2", title: "Call the dentist", item_type: "task", due_at: at(0, 14, 0), nag_policy: "normal", body: "Ask about the cracked filling on the left side.", status: "open" },
  { id: "3", title: "Buy oat milk and bananas", item_type: "grocery", due_at: at(0, 17, 30), nag_policy: "gentle", body: "Unsweetened oat milk, the usual brand.", status: "open" },
  { id: "4", title: "Send the Q3 invoice", item_type: "task", due_at: at(1, 9, 30), nag_policy: "normal", body: "Attach the updated purchase order.", status: "open" },
  { id: "5", title: "Read: Designing calm software", item_type: "link", due_at: at(4, 20, 0), nag_policy: "off", body: "https://example.com/designing-calm-software", url: "https://example.com/designing-calm-software", status: "open" },
  { id: "6", title: "Idea: Sunday reset ritual", item_type: "note", due_at: null, nag_policy: "off", body: "One weekly question: what can leave my head this week?", status: "open" },
  { id: "7", title: "5-minute pasta recipe", item_type: "watch", due_at: at(1, 19, 0), nag_policy: "gentle", body: "Instagram · Alex's Kitchen", status: "open", platform: "Instagram", duration: "6:04", extra: { url: "https://instagram.com/reel/xyz" } },
  { id: "8", title: "How to build a calmer morning", item_type: "watch", due_at: at(3, 21, 0), nag_policy: "gentle", body: "YouTube · 18 min", status: "open", platform: "YouTube", duration: "18:20", extra: { url: "https://youtube.com/watch?v=abc" } },
  { id: "9", title: "Book accommodation for Wellington", item_type: "task", due_at: at(-2, 10, 0), nag_policy: "gentle", body: "", status: "done" },
  { id: "10", title: "Replace the hallway bulb", item_type: "task", due_at: null, nag_policy: "off", body: "", status: "done" },
];

export const mockExternalEvents: ExternalEvent[] = [
  { id: "g1", title: "Design review with Sam", start: at(0, 11, 0), duration: "45 min", source: "Google Calendar" },
  { id: "g2", title: "Dentist appointment", start: at(1, 15, 30), duration: "1 hour", source: "Gmail detected" },
];

export const mockMessages: ChatMessage[] = [
  { id: "m1", role: "assistant", text: "Good morning, Alex. Drop anything here and I will sort it into your OS.", time: "9:38 am" },
  { id: "m2", role: "user", text: "Remind me to call the dentist this afternoon", time: "9:39 am" },
  {
    id: "m3",
    role: "assistant",
    text: "Captured as a task. I will nudge you at 2:00 pm, then again this evening if it is still open.",
    time: "9:39 am",
    receipt: { id: "2", title: "Call the dentist", type: "task", when: "Today · 2:00 pm", nag: "Morning and evening" },
  },
];
