import * as React from "react";

export function PageHeader({ title, sub, actions }: { title: React.ReactNode; sub?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h1 className="m-0 text-[22px] font-semibold tracking-tight">{title}</h1>
        {sub && <div className="mt-1 text-[13px] text-fg-3">{sub}</div>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
