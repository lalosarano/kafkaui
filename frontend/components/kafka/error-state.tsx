import { AlertTriangle } from "lucide-react";

export function ErrorState({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : "Something went wrong";
  return (
    <div className="rounded-3 border border-red/30 bg-red-bg p-4 text-[13px] text-red">
      <div className="flex items-center gap-2 font-medium">
        <AlertTriangle className="h-4 w-4" /> {message}
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon, title, body, cta,
}: { icon: React.ComponentType<{ className?: string }>; title: string; body?: string; cta?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 px-6 py-16 text-center">
      <div className="grid h-9 w-9 place-items-center rounded-2 bg-bg-3 text-fg-3">
        <Icon className="h-4 w-4" />
      </div>
      <h4 className="m-0 text-[14px] font-semibold">{title}</h4>
      {body && <p className="m-0 max-w-sm text-[12.5px] text-fg-3">{body}</p>}
      {cta}
    </div>
  );
}
