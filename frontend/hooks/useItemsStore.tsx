"use client";
import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { Item, ExternalEvent, ChatMessage, Stats } from "@/lib/types";
import { mockItems, mockExternalEvents, mockMessages, DEMO_NOW } from "@/lib/mockData";
import { isOverdue, sameDay, startOfDay } from "@/lib/utils";

type Store = {
  items: Item[];
  externalEvents: ExternalEvent[];
  messages: ChatMessage[];
  now: Date;
  google: boolean;
  gmail: boolean;
  setGoogle: (v: boolean) => void;
  setGmail: (v: boolean) => void;
  addItem: (data: Partial<Item>) => Item;
  updateItem: (id: string, data: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  doneItem: (id: string) => void;
  dropItem: (id: string) => void;
  snoozeItem: (id: string, until: string) => void;
  addMessage: (m: ChatMessage) => void;
  stats: Stats;
};

const Ctx = createContext<Store | null>(null);

export function ItemsProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Item[]>(mockItems);
  const [externalEvents] = useState<ExternalEvent[]>(mockExternalEvents);
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
  const [google, setGoogle] = useState(false);
  const [gmail, setGmail] = useState(false);
  const now = DEMO_NOW;

  const addItem = useCallback((data: Partial<Item>) => {
    const newItem: Item = {
      id: Math.random().toString(36).slice(2),
      title: data.title || "Untitled",
      item_type: data.item_type || "task",
      due_at: data.due_at || null,
      nag_policy: data.nag_policy || "gentle",
      body: data.body || null,
      status: "open",
      extra: data.extra || {},
      url: data.url || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      duration: (data as any).duration,
      platform: (data as any).platform,
    };
    setItems((prev) => [newItem, ...prev]);
    return newItem;
  }, []);

  const updateItem = useCallback((id: string, data: Partial<Item>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...data, updated_at: new Date().toISOString() } : it)));
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const doneItem = useCallback((id: string) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: "done" as const } : it)));
  }, []);

  const dropItem = useCallback((id: string) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: "dropped" as const } : it)));
  }, []);

  const snoozeItem = useCallback((id: string, until: string) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, due_at: until } : it)));
  }, []);

  const addMessage = useCallback((m: ChatMessage) => {
    setMessages((prev) => [...prev, m]);
  }, []);

  const stats = useMemo<Stats>(() => {
    const open = items.filter((i) => i.status === "open");
    const today = open.filter((i) => i.due_at && sameDay(new Date(i.due_at), now));
    const overdue = open.filter((i) => isOverdue(i, now));
    return { open: open.length, today: today.length, overdue: overdue.length };
  }, [items, now]);

  return (
    <Ctx.Provider value={{ items, externalEvents, messages, now, google, gmail, setGoogle, setGmail, addItem, updateItem, deleteItem, doneItem, dropItem, snoozeItem, addMessage, stats }}>
      {children}
    </Ctx.Provider>
  );
}

export const useItemsStore = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useItemsStore must be used within ItemsProvider");
  return ctx;
};
