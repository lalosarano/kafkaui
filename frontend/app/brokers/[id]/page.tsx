"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrokerConfigs } from "@/components/kafka/broker-configs";
import { PageHeader } from "@/components/kafka/page-header";
import { brokersApi } from "@/lib/api/brokers";
import { fmt } from "@/lib/format";

export default function BrokerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const brokersQ = useQuery({ queryKey: ["brokers"], queryFn: brokersApi.list, refetchInterval: 30_000 });
  const broker = brokersQ.data?.find((b) => b.id === id);

  return (
    <div className="max-w-[1600px] animate-fade-in p-5 pb-20">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            Broker {id}
            {broker?.isController && <Badge tone="accent">controller</Badge>}
          </span>
        }
        sub={
          broker
            ? `${broker.host}:${broker.port}${broker.rack ? ` · rack ${broker.rack}` : ""} · ${broker.leaders} leaders · ${broker.diskBytes >= 0 ? fmt.bytes(broker.diskBytes / 1_048_576) : "—"}`
            : "Configuration"
        }
        actions={
          <Button variant="ghost" onClick={() => router.push("/brokers")}>
            <ArrowLeft className="h-3 w-3" /> Back to brokers
          </Button>
        }
      />
      <BrokerConfigs brokerId={id} />
    </div>
  );
}
