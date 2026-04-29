"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/kafka/page-header";

export default function SettingsPage() {
  return (
    <div className="max-w-[1600px] animate-fade-in p-5 pb-20">
      <PageHeader title="Settings" sub="Connection and preferences for this cluster" />
      <Card className="mb-3.5">
        <CardHeader><CardTitle>Connection</CardTitle></CardHeader>
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 p-3.5 text-[12.5px]">
          <span className="text-fg-3">API base</span>
          <span className="font-mono">{process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080/api/v1"}</span>
          <span className="text-fg-3">WebSocket</span>
          <span className="font-mono">{process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080/ws"}</span>
        </div>
      </Card>
      <Card>
        <CardHeader><CardTitle>Preferences</CardTitle></CardHeader>
        <div className="p-3.5 text-[12px] text-fg-3">Use the theme toggle in the topbar to switch between light and dark mode.</div>
      </Card>
    </div>
  );
}
