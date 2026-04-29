"use client";

import { useEffect, useRef, useState } from "react";
import { fmt } from "@/lib/format";

export function AreaChart({
  data,
  color = "var(--accent)",
  height = 160,
  yAxis = false,
}: {
  data: number[];
  color?: string;
  height?: number;
  yAxis?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(400);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  if (!data || data.length === 0) return <div ref={ref} style={{ height }} />;
  const max = Math.max(...data, 1);
  const padL = yAxis ? 40 : 8;
  const padR = 8, padT = 8, padB = 18;
  const chartW = w - padL - padR;
  const chartH = height - padT - padB;
  const step = chartW / Math.max(data.length - 1, 1);
  const points = data.map((v, i) => [padL + i * step, padT + chartH - (v / max) * chartH] as const);
  const path = points.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const fillPath = path + ` L${padL + chartW},${padT + chartH} L${padL},${padT + chartH} Z`;
  const ticks = [0, 0.5, 1].map((t) => max * t);
  const last = points[points.length - 1];
  return (
    <div ref={ref} style={{ width: "100%" }}>
      <svg width={w} height={height} className="block w-full">
        {ticks.map((t, i) => {
          const y = padT + chartH - (t / max) * chartH;
          return (
            <g key={i}>
              <line x1={padL} x2={w - padR} y1={y} y2={y} stroke="var(--border-soft)" strokeDasharray={i === 0 ? "0" : "2 3"} />
              {yAxis && (
                <text x={padL - 6} y={y + 3} textAnchor="end" fontSize="10" fill="var(--fg-3)" fontFamily="var(--font-mono)">
                  {fmt.num(Math.round(t))}
                </text>
              )}
            </g>
          );
        })}
        <path d={fillPath} fill={color} opacity="0.10" />
        <path d={path} fill="none" stroke={color} strokeWidth="1.5" />
        <circle cx={last[0]} cy={last[1]} r="3" fill={color}>
          <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}

export function DualAreaChart({
  data1, data2, color1 = "var(--accent)", color2 = "var(--violet)", height = 160,
}: { data1: number[]; data2: number[]; color1?: string; color2?: string; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(400);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  const max = Math.max(...data1, ...data2, 1);
  const padL = 44, padR = 12, padT = 10, padB = 22;
  const chartW = w - padL - padR;
  const chartH = height - padT - padB;
  const step = chartW / Math.max(data1.length - 1, 1);
  const mkPath = (d: number[]) => d.map((v, i) => (i === 0 ? "M" : "L") + (padL + i * step).toFixed(1) + "," + (padT + chartH - (v / max) * chartH).toFixed(1)).join(" ");
  const mkFill = (d: number[]) => mkPath(d) + ` L${padL + chartW},${padT + chartH} L${padL},${padT + chartH} Z`;
  const ticks = [0, 0.5, 1].map((t) => max * t);
  return (
    <div ref={ref} style={{ width: "100%" }}>
      <svg width={w} height={height} className="block w-full">
        {ticks.map((t, i) => {
          const y = padT + chartH - (t / max) * chartH;
          return (
            <g key={i}>
              <line x1={padL} x2={w - padR} y1={y} y2={y} stroke="var(--border-soft)" strokeDasharray={i === 0 ? "0" : "2 3"} />
              <text x={padL - 8} y={y + 3} textAnchor="end" fontSize="10" fill="var(--fg-3)" fontFamily="var(--font-mono)">
                {fmt.num(Math.round(t))}
              </text>
            </g>
          );
        })}
        <path d={mkFill(data1)} fill={color1} opacity="0.10" />
        <path d={mkPath(data1)} fill="none" stroke={color1} strokeWidth="1.5" />
        <path d={mkFill(data2)} fill={color2} opacity="0.10" />
        <path d={mkPath(data2)} fill="none" stroke={color2} strokeWidth="1.5" />
      </svg>
    </div>
  );
}
