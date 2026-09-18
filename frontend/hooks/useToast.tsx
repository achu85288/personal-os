"use client";
import { createContext, useContext, useState, useCallback } from "react";

type Toast = { id: string; text: string; undo?: () => void; undoLabel?: string };
type Ctx = { toasts: Toast[]; toast: (text: string, undo?: () => void, undoLabel?: string) => void; dismiss: (id: string) => void };

const ToastCtx = createContext<Ctx>({ toasts: [], toast: () => {}, dismiss: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((text: string, undo?: () => void, undoLabel?: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, text, undo, undoLabel }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3400);
  }, []);
  const dismiss = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  return <ToastCtx.Provider value={{ toasts, toast, dismiss }}>{children}</ToastCtx.Provider>;
}

export const useToast = () => useContext(ToastCtx);
