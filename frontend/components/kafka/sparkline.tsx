"use client";

import { useEffect, useRef, useState } from "react";

export function Sparkline({
  data,
  color = "var(--accent)",
  height = 28,
  fill = true,
  animated = false,
}: {
  data: number[];
  color?: string;
  height?: number;
  fill?: boolean;
  animated?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(120);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  if (!data || data.length === 0) return <div ref={ref} style={{ height }} />;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const step = w / (Math.max(data.length - 1, 1));
  const points = data.map((v, i) => [i * step, height - 4 - ((v - min) / range) * (height - 8)] as const);
  const path = points.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const fillPath = path + ` L${w},${height} L0,${height} Z`;
  const last = points[points.length - 1];

  return (
    <div ref={ref} style={{ width: "100%" }}>
      <svg width={w} height={height} className="block w-full">
        {fill && <path d={fillPath} fill={color} opacity="0.12" />}
        <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {animated && (
          <circle cx={last[0]} cy={last[1]} r="2.5" fill={color}>
            <animate attributeName="r" values="2.5;5;2.5" dur="2s" repeatCount="indefinite" />
          </circle>
        )}
      </svg>
    </div>
  );
}
