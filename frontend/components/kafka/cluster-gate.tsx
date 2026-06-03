"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { clusterConfigsApi } from "@/lib/api/cluster-configs";
import { NoClusters } from "./no-clusters";

/**
 * Gates the main content area: when no clusters are configured, every cluster-scoped
 * page would error, so show the quickstart instead. Settings stays reachable so users
 * can set up host aliases before their first connection. While the list is loading we
 * render children (pages show their own skeletons) to avoid a flash.
 */
export function ClusterGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const clustersQ = useQuery({
    queryKey: ["cluster-configs"],
    queryFn: clusterConfigsApi.list,
    staleTime: 30_000,
  });

  const allowWithoutCluster = pathname === "/settings";
  if (clustersQ.data && clustersQ.data.length === 0 && !allowWithoutCluster) {
    return <NoClusters />;
  }
  return <>{children}</>;
}
