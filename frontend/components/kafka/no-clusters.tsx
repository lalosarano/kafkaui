"use client";

import { Plus, Server } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { AddClusterModal } from "./add-cluster-modal";

/**
 * Full-screen quickstart shown when no clusters are configured yet.
 * Kafka GUI is BYO-Kafka, so the very first thing a user must do is connect a broker.
 */
export function NoClusters() {
  const [addOpen, setAddOpen] = React.useState(false);

  return (
    <div className="grid min-h-full place-items-center p-6">
      <div className="w-full max-w-[520px] animate-fade-in text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-3 bg-accent-soft text-accent">
          <Server className="h-6 w-6" />
        </div>
        <h1 className="text-[18px] font-semibold text-fg">Connect your first Kafka cluster</h1>
        <p className="mx-auto mt-2 max-w-[440px] text-[13px] text-fg-3">
          Kafka GUI doesn&apos;t ship with a broker — point it at your own. Add a cluster to start
          browsing topics, consumer groups, schemas, and live messages.
        </p>

        <div className="mx-auto mt-5 max-w-[440px] rounded-3 border border-border bg-bg-2 p-4 text-left">
          <Step n={1} title="Add a cluster" body={<>Enter your <span className="font-mono">bootstrap.servers</span> and, if needed, SASL/SSL.</>} />
          <Step n={2} title="Test the connection" body="Verify the broker is reachable before saving." />
          <Step n={3} title="You're in" body="Browse and manage everything from the sidebar." last />
        </div>

        <div className="mt-5">
          <Button variant="primary" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Add cluster
          </Button>
        </div>

        <p className="mt-3 text-[11.5px] text-fg-4">
          Broker advertises an internal hostname?{" "}
          <Link href="/settings" className="text-accent hover:underline">Configure host aliases</Link> first.
        </p>
      </div>

      <AddClusterModal open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}

function Step({ n, title, body, last }: { n: number; title: string; body: React.ReactNode; last?: boolean }) {
  return (
    <div className={last ? "flex gap-3 pt-2.5" : "flex gap-3 border-b border-border-soft pb-2.5 pt-2.5 first:pt-0"}>
      <div className="mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-accent text-[11px] font-semibold text-accent-fg">
        {n}
      </div>
      <div className="text-[12.5px]">
        <div className="font-medium text-fg">{title}</div>
        <div className="mt-0.5 text-fg-3">{body}</div>
      </div>
    </div>
  );
}
