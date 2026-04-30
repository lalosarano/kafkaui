"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Check, Copy, Pause, Play, RefreshCcw, Search, Send, X,
} from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardSub, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "./error-state";
import { JsonViewer } from "./json-viewer";
import { produceModalEvents } from "./produce-modal";
import { useLiveTail } from "@/lib/stomp/use-tail";
import { messagesApi } from "@/lib/api/messages";
import { fmt } from "@/lib/format";
import type { Message } from "@/lib/types/kafka";
import { cn } from "@/lib/utils";

type SeekMode = "tail" | "end" | "begin" | "offset" | "timestamp";

const SEEK_OPTIONS: { value: SeekMode; label: string; hint: string }[] = [
  { value: "tail", label: "Live tail", hint: "Stream new records as they arrive" },
  { value: "end", label: "From end", hint: "Last N records on the partition" },
  { value: "begin", label: "From beginning", hint: "Earliest available records" },
  { value: "offset", label: "From offset", hint: "Start at a specific offset" },
  { value: "timestamp", label: "From timestamp", hint: "Start at the first record on or after a date" },
];

export function MessageBrowser({
  topicName, partitionCount,
}: { topicName: string; partitionCount: number }) {
  const [seek, setSeek] = React.useState<SeekMode>("tail");
  const [partition, setPartition] = React.useState<string>("all");
  const [paused, setPaused] = React.useState(false);
  const [filter, setFilter] = React.useState("");
  const [limit, setLimit] = React.useState(100);
  const [offsetInput, setOffsetInput] = React.useState("");
  const [tsInput, setTsInput] = React.useState(() => isoLocal(new Date(Date.now() - 60_000)));
  const [selected, setSelected] = React.useState<Message | null>(null);
  const [armedKey, setArmedKey] = React.useState(0);

  const tailEnabled = seek === "tail";
  const tail = useLiveTail(
    tailEnabled ? topicName : null,
    tailEnabled,
    paused,
    partition === "all" ? null : Number(partition),
  );

  // Historical fetch (any non-tail mode). Re-fetches when armedKey or topic/partition changes.
  const histQ = useQuery({
    queryKey: ["messages", topicName, partition, seek, limit, armedKey],
    queryFn: () => {
      const opts: Parameters<typeof messagesApi.fetch>[1] = {
        partition: partition === "all" ? undefined : Number(partition),
        limit,
      };
      if (seek === "begin") opts.seek = "earliest";
      if (seek === "offset") {
        const v = Number(offsetInput);
        if (!Number.isFinite(v) || v < 0) return Promise.resolve([] as Message[]);
        opts.fromOffset = v;
      }
      if (seek === "timestamp") {
        const ts = Date.parse(tsInput);
        if (!Number.isFinite(ts)) return Promise.resolve([] as Message[]);
        opts.fromTimestamp = ts;
      }
      return messagesApi.fetch(topicName, opts);
    },
    enabled: !tailEnabled,
  });

  const messages: Message[] = tailEnabled ? tail.messages : (histQ.data ?? []);
  const filtered = React.useMemo(() => filterMessages(messages, filter, partition), [messages, filter, partition]);

  return (
    <div className={cn("grid gap-3.5", selected ? "[grid-template-columns:1fr_520px] max-[1200px]:grid-cols-1" : "grid-cols-1")}>
      <div className="overflow-hidden rounded-3 border border-border bg-surface">
        <Toolbar
          seek={seek} setSeek={setSeek}
          partition={partition} setPartition={setPartition}
          partitionCount={partitionCount}
          paused={paused} setPaused={setPaused}
          filter={filter} setFilter={setFilter}
          limit={limit} setLimit={setLimit}
          offsetInput={offsetInput} setOffsetInput={setOffsetInput}
          tsInput={tsInput} setTsInput={setTsInput}
          tailStatus={tail.status}
          tailEnabled={tailEnabled}
          onClear={() => { tail.clear(); setSelected(null); }}
          onRefresh={() => setArmedKey((v) => v + 1)}
          onClearFilter={() => setFilter("")}
          totalLoaded={messages.length}
          totalShown={filtered.length}
        />

        <div className="max-h-[560px] overflow-y-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b border-border bg-bg-2 text-[11.5px] font-medium text-fg-3">
                <th className="px-3 py-1.5 text-left">P</th>
                <th className="px-3 py-1.5 text-right">Offset</th>
                <th className="px-3 py-1.5 text-left">Timestamp</th>
                <th className="px-3 py-1.5 text-left">Key</th>
                <th className="px-3 py-1.5 text-left">Value</th>
                <th className="px-3 py-1.5 text-right">Size</th>
              </tr>
            </thead>
            <tbody>
              {!tailEnabled && histQ.isLoading && (
                <tr><td colSpan={6} className="p-3.5"><Skeleton className="h-32" /></td></tr>
              )}
              {!tailEnabled && histQ.error && (
                <tr><td colSpan={6} className="p-3.5"><ErrorState error={histQ.error} /></td></tr>
              )}
              {filtered.map((m, idx) => (
                <Row
                  key={`${m.partition}:${m.offset}:${idx}`}
                  m={m}
                  active={selected?.partition === m.partition && selected?.offset === m.offset}
                  onSelect={() => setSelected(m)}
                />
              ))}
              {!histQ.isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-12 text-center text-fg-3">
                    {tailEnabled
                      ? (paused ? "Paused — resume to receive incoming records." : "Waiting for new records…")
                      : (filter ? "No records match the filter." : "No records to display. Adjust seek and refresh.")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <MessageDetail
          message={selected}
          onClose={() => setSelected(null)}
          onReproduce={() => produceModalEvents.dispatchEvent(new CustomEvent("open", { detail: { topic: topicName, message: selected } }))}
        />
      )}
    </div>
  );
}

function Toolbar(props: {
  seek: SeekMode;
  setSeek: (m: SeekMode) => void;
  partition: string;
  setPartition: (p: string) => void;
  partitionCount: number;
  paused: boolean;
  setPaused: (p: boolean) => void;
  filter: string;
  setFilter: (f: string) => void;
  limit: number;
  setLimit: (n: number) => void;
  offsetInput: string;
  setOffsetInput: (s: string) => void;
  tsInput: string;
  setTsInput: (s: string) => void;
  tailEnabled: boolean;
  tailStatus: ReturnType<typeof useLiveTail>["status"];
  onRefresh: () => void;
  onClear: () => void;
  onClearFilter: () => void;
  totalLoaded: number;
  totalShown: number;
}) {
  const seekDescription = SEEK_OPTIONS.find((o) => o.value === props.seek)?.hint ?? "";
  return (
    <div className="border-b border-border bg-bg-2">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
        <Select className="h-7 w-32" value={props.seek} onChange={(e) => props.setSeek(e.target.value as SeekMode)} aria-label="Seek mode">
          {SEEK_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
        <Select className="h-7 w-32" value={props.partition} onChange={(e) => props.setPartition(e.target.value)} aria-label="Partition">
          <option value="all">All partitions</option>
          {Array.from({ length: props.partitionCount }).map((_, i) => <option key={i} value={i}>Partition {i}</option>)}
        </Select>
        {props.seek === "offset" && (
          <Input
            className="h-7 w-40 font-mono"
            placeholder="offset (e.g. 4823184201)"
            value={props.offsetInput}
            onChange={(e) => props.setOffsetInput(e.target.value)}
            aria-label="From offset"
          />
        )}
        {props.seek === "timestamp" && (
          <Input
            className="h-7 w-52 font-mono text-[11.5px]"
            type="datetime-local"
            step={1}
            value={props.tsInput}
            onChange={(e) => props.setTsInput(e.target.value)}
            aria-label="From timestamp"
          />
        )}
        {props.seek !== "tail" && (
          <Select className="h-7 w-28" value={String(props.limit)} onChange={(e) => props.setLimit(Number(e.target.value))} aria-label="Limit">
            <option value="50">50 msgs</option>
            <option value="100">100 msgs</option>
            <option value="250">250 msgs</option>
            <option value="500">500 msgs</option>
            <option value="1000">1000 msgs</option>
          </Select>
        )}
        {props.tailEnabled ? (
          <Button size="sm" variant={props.paused ? "primary" : "default"} onClick={() => props.setPaused(!props.paused)}>
            {props.paused ? <><Play className="h-3 w-3" /> Resume</> : <><Pause className="h-3 w-3" /> Pause</>}
          </Button>
        ) : (
          <Button size="sm" onClick={props.onRefresh}>
            <RefreshCcw className="h-3 w-3" /> Fetch
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={props.onClear} disabled={props.totalLoaded === 0}>
          <X className="h-3 w-3" /> Clear
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <ConnectionDot tailEnabled={props.tailEnabled} status={props.tailStatus} paused={props.paused} />
          <span className="font-mono tabular-nums text-[12px] text-fg-3">
            {props.totalShown} / {props.totalLoaded}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-border-soft px-3 py-2">
        <div className="flex h-7 min-w-[280px] flex-1 items-center gap-2 rounded-2 border border-border bg-surface px-2.5 text-fg-3 focus-within:border-accent">
          <Search className="h-3.5 w-3.5" />
          <Input
            className="h-full flex-1 border-0 p-0 text-fg shadow-none focus:border-0 focus:ring-0"
            placeholder='Filter — text in key/value, or header:trace-id=abc'
            value={props.filter}
            onChange={(e) => props.setFilter(e.target.value)}
            aria-label="Filter messages"
          />
          {props.filter && (
            <button onClick={props.onClearFilter} aria-label="Clear filter" className="text-fg-3 hover:text-fg">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <span className="text-[11.5px] text-fg-3">{seekDescription}</span>
      </div>
    </div>
  );
}

function ConnectionDot({
  tailEnabled, status, paused,
}: { tailEnabled: boolean; status: ReturnType<typeof useLiveTail>["status"]; paused: boolean }) {
  if (!tailEnabled) return null;
  let label = "Connecting…";
  let color = "bg-amber";
  if (status === "connected") {
    label = paused ? "Paused" : "Tailing";
    color = paused ? "bg-fg-4" : "bg-green";
  } else if (status === "error") {
    label = "Disconnected";
    color = "bg-red";
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11.5px] text-fg-3">
      <span className={cn("h-1.5 w-1.5 rounded-full", color, status === "connecting" && "animate-soft-pulse", status === "connected" && !paused && "animate-soft-pulse")} />
      {label}
    </span>
  );
}

function Row({ m, active, onSelect }: { m: Message; active: boolean; onSelect: () => void }) {
  const fresh = (m as Message & { _new?: boolean })._new === true;
  return (
    <tr
      data-active={active}
      onClick={onSelect}
      className={cn(
        "cursor-pointer border-b border-border-soft last:border-b-0 hover:bg-bg-hover",
        active && "bg-bg-active",
        fresh && "animate-tail-in",
      )}
    >
      <td className="px-3 py-1.5 font-mono tabular-nums text-fg-3">P{m.partition}</td>
      <td className="px-3 py-1.5 text-right font-mono tabular-nums">{fmt.numFull(m.offset)}</td>
      <td className="px-3 py-1.5 font-mono text-fg-3">{fmt.time(m.timestamp)}</td>
      <td className="max-w-[140px] overflow-hidden text-ellipsis whitespace-nowrap px-3 py-1.5 font-mono text-accent">
        {m.key ?? <span className="text-fg-4">∅</span>}
      </td>
      <td className="max-w-[420px] overflow-hidden text-ellipsis whitespace-nowrap px-3 py-1.5 font-mono text-fg-2">
        <FormatBadge format={m.valueFormat} />
        <span className="ml-1.5">{previewValue(m.value)}</span>
      </td>
      <td className="px-3 py-1.5 text-right font-mono tabular-nums text-fg-3">{m.sizeBytes}B</td>
    </tr>
  );
}

function FormatBadge({ format }: { format: Message["valueFormat"] }) {
  if (format === "null") return <span className="text-[10px] text-fg-4">∅</span>;
  const tone = format === "json" ? "accent" : format === "avro" || format === "protobuf" ? "violet" : format === "base64" ? "amber" : "default";
  return <Badge tone={tone as never} className="!h-[16px] !text-[10px]">{format}</Badge>;
}

function MessageDetail({ message, onClose, onReproduce }: { message: Message; onClose: () => void; onReproduce: () => void }) {
  const [tab, setTab] = React.useState<"value" | "raw" | "headers">("value");
  return (
    <Card className="self-start">
      <CardHeader>
        <div className="min-w-0">
          <CardTitle>Message detail</CardTitle>
          <CardSub className="font-mono">P{message.partition} · offset {fmt.numFull(message.offset)}</CardSub>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onReproduce}>
            <Send className="h-3 w-3" /> Reproduce
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <div className="grid grid-cols-[auto_1fr] gap-x-3.5 gap-y-1 border-b border-border p-3.5 text-[12px]">
        <span className="text-fg-3">Timestamp</span>
        <span className="font-mono">
          {new Date(message.timestamp).toISOString()}{" "}
          <span className="text-fg-4">({fmt.ago(message.timestamp)})</span>
        </span>
        <span className="text-fg-3">Format</span>
        <span className="flex items-center gap-1.5"><FormatBadge format={message.valueFormat} />{message.schemaId !== null && (<span className="font-mono text-fg-3">schema id {message.schemaId}</span>)}</span>
        <span className="text-fg-3">Size</span>
        <span className="font-mono">{message.sizeBytes} B</span>
        <span className="text-fg-3">Key</span>
        <CopyableText className="font-mono text-accent" text={message.key ?? ""}>{message.key ?? <span className="text-fg-4">null</span>}</CopyableText>
      </div>

      <div className="flex border-b border-border">
        {(["value", "raw", "headers"] as const).map((t) => (
          <button
            key={t}
            data-active={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "border-b-2 border-transparent px-3 py-2 text-[12px] capitalize text-fg-3 hover:text-fg-2",
              tab === t && "border-accent text-fg",
            )}
          >
            {t === "headers" ? `Headers (${Object.keys(message.headers).length})` : t}
          </button>
        ))}
        <div className="flex-1" />
        {tab !== "headers" && (
          <CopyButton
            text={tab === "raw" ? rawValueText(message) : JSON.stringify(message.value, null, 2)}
            label={tab === "raw" ? "Copy raw" : "Copy JSON"}
          />
        )}
      </div>

      <div className="max-h-[420px] overflow-auto">
        {tab === "value" && <ValueView message={message} />}
        {tab === "raw" && <RawView message={message} />}
        {tab === "headers" && <HeadersView headers={message.headers} />}
      </div>
    </Card>
  );
}

function ValueView({ message }: { message: Message }) {
  if (message.value === null) return <div className="p-3.5 text-[12px] text-fg-4">null</div>;
  if (typeof message.value === "string") return <pre className="jsonv whitespace-pre-wrap break-words">{message.value}</pre>;
  return <JsonViewer data={message.value as object} />;
}

function RawView({ message }: { message: Message }) {
  return (
    <pre className="jsonv whitespace-pre-wrap break-words">
      {rawValueText(message)}
    </pre>
  );
}

function rawValueText(m: Message): string {
  if (m.value === null) return "null";
  if (typeof m.value === "string") return m.value;
  return JSON.stringify(m.value, null, 2);
}

function HeadersView({ headers }: { headers: Record<string, string> }) {
  const entries = Object.entries(headers);
  if (entries.length === 0) return <div className="p-3.5 text-[12px] text-fg-4">No headers.</div>;
  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 p-3.5 text-[12px]">
      {entries.map(([k, v]) => (
        <React.Fragment key={k}>
          <span className="font-mono text-fg-3">{k}</span>
          <CopyableText className="font-mono" text={v}>{v}</CopyableText>
        </React.Fragment>
      ))}
    </div>
  );
}

function CopyableText({ text, children, className }: { text: string; children: React.ReactNode; className?: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <span className="group inline-flex items-center gap-1.5">
      <span className={className}>{children}</span>
      {text && (
        <button
          aria-label="Copy"
          className="opacity-0 transition-opacity group-hover:opacity-100 text-fg-3 hover:text-fg"
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
        >
          {copied ? <Check className="h-3 w-3 text-green" /> : <Copy className="h-3 w-3" />}
        </button>
      )}
    </span>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1200); }}
      className="mr-2 inline-flex items-center gap-1 px-2 py-1 text-[11.5px] text-fg-3 hover:text-fg"
    >
      {copied ? <Check className="h-3 w-3 text-green" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : label}
    </button>
  );
}

function previewValue(v: Message["value"]): string {
  if (v === null) return "null";
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v).slice(0, 400);
  } catch {
    return String(v);
  }
}

/**
 * Filter syntax:
 *   plain text → matches (case-insensitive) inside key, stringified value
 *   header:foo → message has any header named "foo"
 *   header:foo=bar → header "foo" equals "bar" (substring match)
 *   p:N → restrict to partition N (override the partition dropdown)
 *   key:abc → key contains "abc"
 *   value:abc → value (stringified) contains "abc"
 */
function filterMessages(msgs: Message[], filter: string, partitionFilter: string): Message[] {
  const tokens = filter.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0 && partitionFilter === "all") return msgs;
  return msgs.filter((m) => {
    if (partitionFilter !== "all" && m.partition !== Number(partitionFilter)) return false;
    for (const t of tokens) {
      if (!matchToken(m, t)) return false;
    }
    return true;
  });
}

function matchToken(m: Message, token: string): boolean {
  const lower = token.toLowerCase();
  if (token.startsWith("p:")) return m.partition === Number(token.slice(2));
  if (token.startsWith("key:")) return (m.key ?? "").toLowerCase().includes(token.slice(4).toLowerCase());
  if (token.startsWith("value:")) return JSON.stringify(m.value).toLowerCase().includes(token.slice(6).toLowerCase());
  if (token.startsWith("header:")) {
    const rest = token.slice(7);
    const eq = rest.indexOf("=");
    if (eq < 0) return Object.keys(m.headers).some((h) => h.toLowerCase() === rest.toLowerCase());
    const hk = rest.slice(0, eq).toLowerCase();
    const hv = rest.slice(eq + 1).toLowerCase();
    const found = Object.entries(m.headers).find(([k]) => k.toLowerCase() === hk);
    return !!found && found[1].toLowerCase().includes(hv);
  }
  // generic substring against key + value
  return (m.key ?? "").toLowerCase().includes(lower)
    || JSON.stringify(m.value).toLowerCase().includes(lower);
}

function isoLocal(d: Date): string {
  // datetime-local needs YYYY-MM-DDTHH:MM:SS in local TZ
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
