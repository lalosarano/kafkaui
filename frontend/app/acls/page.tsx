"use client";

import { useQuery } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreateAclModal } from "@/components/kafka/create-acl-modal";
import { DataTable } from "@/components/kafka/data-table";
import { ErrorState } from "@/components/kafka/error-state";
import { PageHeader } from "@/components/kafka/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { aclsApi } from "@/lib/api/acls";
import type { Acl } from "@/lib/types/kafka";

export default function AclsPage() {
  const [filter, setFilter] = React.useState("");
  const [createOpen, setCreateOpen] = React.useState(false);

  const aclsQ = useQuery({ queryKey: ["acls"], queryFn: () => aclsApi.list() });

  const filtered = (aclsQ.data ?? []).filter((a) =>
    a.principal.toLowerCase().includes(filter.toLowerCase()) ||
    a.resourceName.toLowerCase().includes(filter.toLowerCase()),
  );

  const columns = React.useMemo<ColumnDef<Acl>[]>(
    () => [
      { accessorKey: "principal", header: "Principal", cell: ({ row }) => <span className="font-mono">{row.original.principal}</span> },
      { accessorKey: "resourceName", header: "Resource", cell: ({ row }) => <span className="font-mono">{row.original.resourceType}:{row.original.resourceName}</span> },
      { accessorKey: "patternType", header: "Pattern", cell: ({ row }) => <span className="text-[11.5px] text-fg-3">{row.original.patternType}</span> },
      { accessorKey: "operation", header: "Operation", cell: ({ row }) => <span className="font-mono">{row.original.operation}</span> },
      {
        accessorKey: "permissionType",
        header: "Permission",
        cell: ({ row }) =>
          row.original.permissionType === "ALLOW" ? (
            <Badge tone="green" dot>Allow</Badge>
          ) : (
            <Badge tone="red" dot>Deny</Badge>
          ),
      },
      { accessorKey: "host", header: "Host", cell: ({ row }) => <span className="font-mono text-fg-3">{row.original.host}</span> },
    ],
    [],
  );

  return (
    <div className="max-w-[1600px] animate-fade-in p-5 pb-20">
      <PageHeader
        title="Access control"
        sub={aclsQ.data ? `${aclsQ.data.length} ACLs · ${new Set(aclsQ.data.map((a) => a.principal)).size} principals` : "loading…"}
        actions={
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3 w-3" /> Create ACL
          </Button>
        }
      />
      {aclsQ.error && <ErrorState error={aclsQ.error} />}
      <div className="mb-3 flex items-center gap-2 rounded-3 border border-border bg-bg-2 px-3 py-2.5">
        <Input className="w-72" placeholder="Filter principals or resources…" value={filter} onChange={(e) => setFilter(e.target.value)} />
        <div className="flex-1" />
        <span className="text-[12px] text-fg-3">{filtered.length} ACLs</span>
      </div>
      {aclsQ.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <DataTable columns={columns} data={filtered} emptyState="No ACLs configured" />
      )}
      <CreateAclModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
