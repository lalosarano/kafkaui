"use client";

import { AlertTriangle } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogBody, DialogCloseIcon, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  confirmText,
  onConfirm,
  destructive = true,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  confirmText: string;
  onConfirm: () => void | Promise<void>;
  destructive?: boolean;
}) {
  const [typed, setTyped] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  React.useEffect(() => { if (open) { setTyped(""); setBusy(false); } }, [open]);
  const ok = typed === confirmText;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-2 bg-red-bg text-red">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </div>
          <DialogCloseIcon />
        </DialogHeader>
        <DialogBody>
          <label htmlFor="confirm-input" className="mb-1.5 block text-[11.5px] font-medium text-fg-2">
            To confirm, type{" "}
            <span className="rounded-1 bg-bg-3 px-1.5 py-0.5 font-mono text-fg">{confirmText}</span> below
          </label>
          <Input
            id="confirm-input"
            className="font-mono"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={confirmText}
            autoFocus
          />
        </DialogBody>
        <DialogFooter>
          <Button variant="default" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button
            variant={destructive ? "danger" : "primary"}
            disabled={!ok || busy}
            onClick={async () => {
              try {
                setBusy(true);
                await onConfirm();
                onOpenChange(false);
              } finally {
                setBusy(false);
              }
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
