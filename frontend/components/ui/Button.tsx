"use client";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "default" | "sm";

export function Button({
  variant = "secondary",
  size = "default",
  className,
  grow,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; grow?: boolean }) {
  const base = "inline-flex items-center justify-center gap-1.5 rounded-sm font-semibold transition-all active:scale-[0.97] disabled:opacity-45 disabled:pointer-events-none";
  const sizes = size === "sm" ? "min-h-[44px] px-3 text-[12.5px]" : "min-h-[44px] px-[15px] text-[13px]";
  const variants: Record<Variant, string> = {
    primary: "bg-brand text-on-brand shadow-brand hover:bg-brand-hover",
    secondary: "bg-surface border border-border text-text-2 hover:bg-surface-3 hover:text-text-1 hover:border-border-strong",
    ghost: "bg-transparent text-text-2 hover:bg-surface-3",
    danger: "bg-danger-bg text-danger-fg hover:brightness-95",
  };
  return <button className={cn(base, sizes, variants[variant], grow && "flex-1", className)} {...props} />;
}
