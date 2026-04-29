"use client";

import { CheckCircle2, Info, XCircle } from "lucide-react";
import * as React from "react";

type Tone = "success" | "error" | "info";
type ToastItem = { id: string; tone: Tone; msg: React.ReactNode };

const bus = new EventTarget();
let buf: ToastItem[] = [];

export function toast(t: { tone?: Tone; msg: React.ReactNode; duration?: number }) {
  const item: ToastItem = { id: Math.random().toString(36).slice(2), tone: t.tone ?? "info", msg: t.msg };
  buf = [...buf, item];
  bus.dispatchEvent(new Event("change"));
  setTimeout(() => {
    buf = buf.filter((x) => x.id !== item.id);
    bus.dispatchEvent(new Event("change"));
  }, t.duration ?? 3000);
}

export function ToastMount() {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  React.useEffect(() => {
    const onChange = () => setItems([...buf]);
    bus.addEventListener("change", onChange);
    return () => bus.removeEventListener("change", onChange);
  }, []);
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center gap-2.5 rounded-2 border border-border-2 bg-bg-2 px-3.5 py-2 text-[12.5px] text-fg shadow-[var(--shadow-md)] animate-in fade-in slide-in-from-bottom-2"
        >
          <span className="grid place-items-center">
            {t.tone === "success" && <CheckCircle2 className="h-4 w-4 text-green" />}
            {t.tone === "error" && <XCircle className="h-4 w-4 text-red" />}
            {t.tone === "info" && <Info className="h-4 w-4 text-fg-3" />}
          </span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
