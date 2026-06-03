import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Sidebar } from "@/components/kafka/sidebar";
import { Topbar } from "@/components/kafka/topbar";
import { ClusterGate } from "@/components/kafka/cluster-gate";
import { CommandPaletteMount } from "@/components/kafka/command-palette";
import { ProduceModalMount } from "@/components/kafka/produce-modal";
import { ToastMount } from "@/components/kafka/toast";

export const metadata: Metadata = {
  title: "Kafka GUI",
  description: "Web administration console for Apache Kafka",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          <div className="grid h-screen w-screen overflow-hidden" style={{ gridTemplateColumns: "232px 1fr" }}>
            <Sidebar />
            <main className="flex min-w-0 flex-col overflow-hidden">
              <Topbar />
              <div className="relative flex-1 overflow-y-auto overflow-x-hidden">
                <ClusterGate>{children}</ClusterGate>
              </div>
            </main>
          </div>
          <CommandPaletteMount />
          <ProduceModalMount />
          <ToastMount />
        </Providers>
      </body>
    </html>
  );
}
