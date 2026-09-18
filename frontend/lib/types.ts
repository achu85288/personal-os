export type ItemType = "task" | "grocery" | "link" | "read" | "watch" | "note" | "expense";
export type ItemStatus = "open" | "done" | "dropped" | "someday";
export type NagPolicy = "off" | "gentle" | "normal" | "relentless";

export interface Item {
  id: string;
  user_id?: string;
  title: string;
  item_type: ItemType;
  body?: string | null;
  url?: string | null;
  due_at: string | null;
  status: ItemStatus;
  nag_policy: NagPolicy;
  extra?: Record<string, unknown> | null;
  source?: string;
  created_at?: string;
  updated_at?: string;
  // derived for UI compat with old html
  duration?: string;
  platform?: string;
}

export interface ExternalEvent {
  id: string;
  title: string;
  start: string;
  duration: string;
  source: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  time: string;
  receipt?: {
    id: string;
    title: string;
    type: ItemType;
    when: string;
    nag: string;
  };
}

export interface Stats {
  open: number;
  today: number;
  overdue: number;
}

export type Lens = "all" | "overdue" | "today" | "week";
export type CalView = "week" | "month" | "agenda";
export type Theme = "system" | "light" | "dark";
