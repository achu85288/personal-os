import { Item } from "./types";

export const NZ_TZ = "Pacific/Auckland";

export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export function escAttr(s: string) {
  return s.replace(/"/g, "&quot;");
}

export function formatTime(iso: string | null): string {
  if (!iso) return "No date";
  return new Date(iso).toLocaleTimeString("en-NZ", { hour: "numeric", minute: "2-digit", timeZone: NZ_TZ });
}

export function formatDate(d: Date, opts?: Intl.DateTimeFormatOptions) {
  return d.toLocaleDateString("en-NZ", { timeZone: NZ_TZ, ...opts });
}

export function dueLabel(iso: string | null, now = new Date()): string {
  if (!iso) return "No date";
  const d = new Date(iso);
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);
  if (sameDay(d, today)) return `Today · ${formatTime(iso)}`;
  if (sameDay(d, tomorrow)) return `Tomorrow · ${formatTime(iso)}`;
  return `${formatDate(d, { weekday: "short", day: "numeric", month: "short" })} · ${formatTime(iso)}`;
}

export function fromNow(iso: string | null, now = new Date()): string {
  if (!iso) return "";
  const mins = Math.round((new Date(iso).getTime() - now.getTime()) / 60000);
  const abs = Math.abs(mins);
  let label: string;
  if (abs < 60) label = `${abs} min`;
  else if (abs < 60 * 24) label = `${Math.round(abs / 60)} ${Math.round(abs / 60) === 1 ? "hour" : "hours"}`;
  else label = `${Math.round(abs / 1440)} ${Math.round(abs / 1440) === 1 ? "day" : "days"}`;
  return mins >= 0 ? `in ${label}` : `${label} ago`;
}

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function isOverdue(item: Item, now = new Date()): boolean {
  return item.status === "open" && !!item.due_at && new Date(item.due_at) < now;
}

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalInputValue(v: string): string | null {
  if (!v) return null;
  return new Date(v).toISOString();
}
