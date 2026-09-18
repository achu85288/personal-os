import { ItemType } from "./types";

export const ITEM_TYPE_META: Record<ItemType, { label: string; icon: string; colorClass: string; chipClass: string }> = {
  task:    { label: "Task",    icon: "doc",  colorClass: "bg-brand",          chipClass: "bg-brand-tint text-brand" },
  grocery: { label: "Grocery", icon: "cart", colorClass: "bg-done-fg",        chipClass: "bg-done-bg text-done-fg" },
  link:    { label: "Link",    icon: "link", colorClass: "bg-info-fg",        chipClass: "bg-info-bg text-info-fg" },
  read:    { label: "Read",    icon: "book", colorClass: "bg-watch-fg",       chipClass: "bg-watch-bg text-watch-fg" },
  watch:   { label: "Watch",   icon: "play", colorClass: "bg-watch-fg",       chipClass: "bg-watch-bg text-watch-fg" },
  note:    { label: "Note",    icon: "list", colorClass: "bg-border-strong", chipClass: "bg-neutral-bg text-neutral-fg" },
  expense: { label: "Expense", icon: "card", colorClass: "bg-attention-fg",   chipClass: "bg-attention-bg text-attention-fg" },
};

export const NAG_LABEL: Record<string, string> = {
  off: "No reminders",
  gentle: "Once a day",
  normal: "Morning and evening",
  relentless: "Every 3 hours",
};

export const NAG_CHIP: Record<string, string> = {
  off: "No nudges",
  gentle: "Gentle nudge",
  normal: "Normal nudges",
  relentless: "Relentless",
};

export const APP_NAME = "Personal OS";
export const APP_TAGLINE = "your second brain";
export const TIMEZONE = "Pacific/Auckland";
