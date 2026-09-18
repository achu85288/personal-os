"use client";
import { formatDate } from "@/lib/utils";
import { DEMO_NOW } from "@/lib/mockData";

export function Greeting({ overdue, today, open }: { overdue: number; today: number; open: number }) {
  const todayLabel = formatDate(DEMO_NOW, { weekday: "long", day: "numeric", month: "long" });
  let lede = "";
  if (overdue) lede = `${overdue} ${overdue === 1 ? "item is" : "items are"} overdue and ${today} due today. Start with the overdue one.`;
  else if (today) lede = `${today} ${today === 1 ? "thing is" : "things are"} due today. You are on track.`;
  else lede = `Nothing due today. ${open} open loops are waiting quietly.`;

  return (
    <div className="mt-4 mb-4">
      <p className="m-0 text-text-3 text-[11px] font-bold uppercase tracking-[0.09em]">{todayLabel}</p>
      <h1 className="mt-1 text-[27px] leading-[1.12] font-bold tracking-[-0.025em]">Good morning, <em className="not-italic text-brand">Alex</em></h1>
      <p className="mt-1 text-text-2 text-[13px]">{lede}</p>
    </div>
  );
}
