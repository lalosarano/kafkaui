"use client";

import { Shield } from "lucide-react";
import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { aclsApi } from "@/lib/api/acls";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogBody, DialogCloseIcon, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { toast } from "./toast";
import { Badge } from "@/components/ui/badge";

const OPS = ["READ", "WRITE", "CREATE", "DELETE", "ALTER", "DESCRIBE", "CLUSTER_ACTION", "ALL"];

export function CreateAclModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const [principal, setPrincipal] = React.useState("");
  const [host, setHost] = React.useState("*");
  const [resourceType, setResourceType] = React.useState("TOPIC");
  const [resourceName, setResourceName] = React.useState("");
  const [patternType, setPatternType] = React.useState("LITERAL");
  const [operation, setOperation] = React.useState("READ");
  const [permissionType, setPermissionType] = React.useState<"ALLOW" | "DENY">("ALLOW");

  const mut = useMutation({
    mutationFn: () =>
      aclsApi.create({ principal, host, resourceType, resourceName, patternType, operation, permissionType }),
    onSuccess: () => {
      onOpenChange(false);
      toast({ tone: "success", msg: "ACL created" });
      qc.invalidateQueries({ queryKey: ["acls"] });
    },
    onError: (err: unknown) => toast({ tone: "error", msg: err instanceof Error ? err.message : "Create failed" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-2 bg-accent-soft text-accent">
            <Shield className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <DialogTitle>Create ACL</DialogTitle>
            <DialogDescription>Grant or deny operations on Kafka resources to a specific principal.</DialogDescription>
          </div>
          <DialogCloseIcon />
        </DialogHeader>
        <DialogBody>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[11.5px] font-medium text-fg-2">Principal <span className="text-red">*</span></label>
              <Input className="font-mono" placeholder="User:my-service" value={principal} onChange={(e) => setPrincipal(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-[11.5px] font-medium text-fg-2">Host</label>
              <Input className="font-mono" value={host} onChange={(e) => setHost(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-[11.5px] font-medium text-fg-2">Resource type</label>
              <Select value={resourceType} onChange={(e) => setResourceType(e.target.value)}>
                <option value="TOPIC">Topic</option>
                <option value="GROUP">Group</option>
                <option value="CLUSTER">Cluster</option>
                <option value="TRANSACTIONAL_ID">TransactionalId</option>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-[11.5px] font-medium text-fg-2">Pattern</label>
              <Select value={patternType} onChange={(e) => setPatternType(e.target.value)}>
                <option value="LITERAL">Literal</option>
                <option value="PREFIXED">Prefixed</option>
              </Select>
            </div>
            <div className="col-span-2">
              <label className="mb-1.5 block text-[11.5px] font-medium text-fg-2">Resource name</label>
              <Input className="font-mono" value={resourceName} onChange={(e) => setResourceName(e.target.value)} placeholder="e.g. orders.events.v3" />
            </div>
            <div className="col-span-2">
              <label className="mb-1.5 block text-[11.5px] font-medium text-fg-2">Operation</label>
              <Select value={operation} onChange={(e) => setOperation(e.target.value)}>
                {OPS.map((o) => <option key={o} value={o}>{o}</option>)}
              </Select>
            </div>
            <div className="col-span-2">
              <label className="mb-1.5 block text-[11.5px] font-medium text-fg-2">Permission</label>
              <div className="flex gap-2">
                {(["ALLOW", "DENY"] as const).map((p) => (
                  <label key={p} className="flex flex-1 cursor-pointer items-center gap-2 rounded-2 border border-border p-2.5">
                    <input type="radio" checked={permissionType === p} onChange={() => setPermissionType(p)} />
                    <Badge tone={p === "ALLOW" ? "green" : "red"} dot>{p}</Badge>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" disabled={!principal || !resourceName || mut.isPending} onClick={() => mut.mutate()}>
            <Shield className="h-3 w-3" /> Create ACL
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
