"use client";
import { useToast } from "@/hooks/useToast";

export function ToastHost() {
  const { toasts, dismiss } = useToast();
  if (!toasts.length) return null;
  return (
    <div className="fixed z-[70] left-1/2 bottom-[calc(74px+env(safe-area-inset-bottom,0px))] -translate-x-1/2 w-[calc(100%-32px)] max-w-[400px] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto flex items-center gap-3 px-3.5 py-2.5 bg-[#1B2537] text-white rounded-sm shadow-e3 text-[12.5px] font-semibold animate-[toastIn_180ms_ease]">
          <span className="flex-1">{t.text}</span>
          {t.undo && (
            <button onClick={() => { t.undo?.(); dismiss(t.id); }} className="min-h-[32px] px-2.5 rounded-[7px] bg-white/15 text-white text-[12px] font-bold hover:bg-white/25">
              {t.undoLabel || "Undo"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
