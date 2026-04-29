// shared.jsx — small reusable bits used across screens

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// --- formatters ---
const fmt = {
  num: (n) => {
    if (n == null) return "—";
    if (Math.abs(n) >= 1e12) return (n / 1e12).toFixed(2) + "T";
    if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + "B";
    if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + "M";
    if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + "K";
    return String(n);
  },
  numFull: (n) => n == null ? "—" : n.toLocaleString("en-US"),
  bytes: (mb) => {
    if (mb == null) return "—";
    if (mb >= 1024 * 1024) return (mb / 1024 / 1024).toFixed(2) + " TB";
    if (mb >= 1024) return (mb / 1024).toFixed(2) + " GB";
    if (mb >= 1) return mb.toFixed(1) + " MB";
    return (mb * 1024).toFixed(0) + " KB";
  },
  ms: (ms) => {
    if (ms === -1 || ms == null) return "Forever";
    const s = ms / 1000;
    if (s >= 86400 * 30) return Math.round(s / 86400 / 30) + "mo";
    if (s >= 86400) return Math.round(s / 86400) + "d";
    if (s >= 3600) return Math.round(s / 3600) + "h";
    if (s >= 60) return Math.round(s / 60) + "m";
    return s + "s";
  },
  rate: (n) => {
    if (n == null) return "—";
    if (n >= 1e6) return (n / 1e6).toFixed(2) + "M/s";
    if (n >= 1e3) return (n / 1e3).toFixed(1) + "K/s";
    return n + "/s";
  },
  time: (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString("en-US", { hour12: false }) + "." + String(d.getMilliseconds()).padStart(3, "0");
  },
  ago: (ts) => {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return s + "s ago";
    if (s < 3600) return Math.floor(s / 60) + "m ago";
    if (s < 86400) return Math.floor(s / 3600) + "h ago";
    return Math.floor(s / 86400) + "d ago";
  },
};
window.fmt = fmt;

// --- Sparkline (SVG, smooth) ---
function Sparkline({ data, color = "var(--accent)", height = 28, fill = true, animated = false }) {
  const ref = useRef(null);
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
  const step = w / (data.length - 1 || 1);
  const points = data.map((v, i) => [i * step, height - 4 - ((v - min) / range) * (height - 8)]);
  const path = points.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const fillPath = path + ` L${w},${height} L0,${height} Z`;
  return (
    <svg ref={ref} width={w} height={height} style={{ display: "block", width: "100%" }}>
      {fill && <path d={fillPath} fill={color} opacity="0.12"/>}
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {animated && points.length > 0 && (
        <circle cx={points[points.length-1][0]} cy={points[points.length-1][1]} r="2.5" fill={color}>
          <animate attributeName="r" values="2.5;5;2.5" dur="2s" repeatCount="indefinite"/>
        </circle>
      )}
    </svg>
  );
}
window.Sparkline = Sparkline;

// --- Bar / Area chart, larger ---
function AreaChart({ data, color = "var(--accent)", height = 140, yAxis = false, yLabel = "" }) {
  const ref = useRef(null);
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
  const step = chartW / (data.length - 1 || 1);
  const points = data.map((v, i) => [padL + i * step, padT + chartH - (v / max) * chartH]);
  const path = points.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const fillPath = path + ` L${padL + chartW},${padT + chartH} L${padL},${padT + chartH} Z`;
  const ticks = [0, 0.5, 1].map(t => max * t);
  return (
    <svg ref={ref} width={w} height={height} style={{ display: "block", width: "100%" }}>
      {/* grid */}
      {ticks.map((t, i) => {
        const y = padT + chartH - (t / max) * chartH;
        return <line key={i} x1={padL} x2={w - padR} y1={y} y2={y} stroke="var(--border-soft)" strokeDasharray={i === 0 ? "0" : "2 3"} />;
      })}
      {yAxis && ticks.map((t, i) => {
        const y = padT + chartH - (t / max) * chartH;
        return <text key={"l" + i} x={padL - 6} y={y + 3} textAnchor="end" fontSize="10" fill="var(--fg-3)" fontFamily="var(--font-mono)">{fmt.num(Math.round(t))}</text>;
      })}
      <path d={fillPath} fill={color} opacity="0.10"/>
      <path d={path} fill="none" stroke={color} strokeWidth="1.5"/>
      <circle cx={points[points.length-1][0]} cy={points[points.length-1][1]} r="3" fill={color}>
        <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite"/>
      </circle>
    </svg>
  );
}
window.AreaChart = AreaChart;

// --- StatusBadge for consumer group state, broker, etc ---
function StatusBadge({ state }) {
  const map = {
    stable: { tone: "green", label: "Stable" },
    rebalancing: { tone: "amber", label: "Rebalancing" },
    empty: { tone: "gray", label: "Empty" },
    dead: { tone: "red", label: "Dead" },
    healthy: { tone: "green", label: "Healthy" },
    warning: { tone: "amber", label: "Warning" },
    error: { tone: "red", label: "Error" },
    internal: { tone: "violet", label: "Internal" },
  };
  const s = map[state] || { tone: "gray", label: state };
  return <span className="badge" data-tone={s.tone}><span className="ico"/>{s.label}</span>;
}
window.StatusBadge = StatusBadge;

// --- Lag indicator ---
function LagIndicator({ lag }) {
  const tone = lag === 0 ? "green" : lag < 100 ? "green" : lag < 10000 ? "amber" : "red";
  return (
    <span className="row" style={{ gap: 6 }}>
      <span className="sdot" data-tone={tone}/>
      <span className="mono tabnum" style={{ color: lag > 10000 ? "var(--red)" : lag > 100 ? "var(--amber)" : "var(--fg-2)" }}>
        {fmt.numFull(lag)}
      </span>
    </span>
  );
}
window.LagIndicator = LagIndicator;

// --- JSON viewer (recursive, collapsible) ---
function JsonNode({ data, k, depth = 0, collapsed: defaultCollapsed = false }) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed && depth > 0);
  const isObj = data !== null && typeof data === "object" && !Array.isArray(data);
  const isArr = Array.isArray(data);

  if (isObj || isArr) {
    const entries = isObj ? Object.entries(data) : data.map((v, i) => [i, v]);
    const open = isArr ? "[" : "{";
    const close = isArr ? "]" : "}";
    return (
      <div style={{ marginLeft: depth === 0 ? 0 : 12 }}>
        <span onClick={(e) => { e.stopPropagation(); setCollapsed(c => !c); }} style={{ cursor: "pointer" }}>
          {k != null && <span><span className="jsk">"{k}"</span><span className="jsp">: </span></span>}
          <span className="jsp" style={{ color: "var(--fg-4)", fontSize: 10, marginRight: 4, display: "inline-block", width: 10, transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform 100ms" }}>▼</span>
          <span className="jsp">{open}</span>
          {collapsed && <span className="jsnu" style={{ marginLeft: 4 }}>{entries.length} {isArr ? "items" : "keys"}</span>}
          {collapsed && <span className="jsp">{close}</span>}
        </span>
        {!collapsed && (
          <>
            {entries.map(([ek, ev], i) => (
              <div key={ek} style={{ marginLeft: 12 }}>
                <JsonNode data={ev} k={isObj ? ek : null} depth={depth + 1}/>
                {i < entries.length - 1 && <span className="jsp">,</span>}
              </div>
            ))}
            <div><span className="jsp">{close}</span></div>
          </>
        )}
      </div>
    );
  }

  let className = "jsnu", text = "null";
  if (typeof data === "string") { className = "jss"; text = `"${data}"`; }
  else if (typeof data === "number") { className = "jsn"; text = String(data); }
  else if (typeof data === "boolean") { className = "jsb"; text = String(data); }
  return <span>{k != null && <><span className="jsk">"{k}"</span><span className="jsp">: </span></>}<span className={className}>{text}</span></span>;
}
function JsonViewer({ data }) {
  return <div className="jsonv"><JsonNode data={data} /></div>;
}
window.JsonViewer = JsonViewer;

// --- Modal primitive ---
function Modal({ open, onClose, children, size }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  return (
    <div className="modal-overlay" data-open={open} onClick={onClose}>
      <div className="modal" data-size={size} onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  );
}
window.Modal = Modal;

// --- Toast hook ---
function useToasts() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((toast) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, ...toast }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), toast.duration || 3000);
  }, []);
  const ToastStack = () => (
    <div className="toast-stack">
      {toasts.map(t => (
        <div key={t.id} className="toast" data-tone={t.tone || "info"}>
          <span className="ico" style={{ display: "grid", placeItems: "center" }}>
            {t.tone === "success" && <I.check_circle/>}
            {t.tone === "error" && <I.x_circle/>}
            {!t.tone && <I.info/>}
          </span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
  return { push, ToastStack };
}
window.useToasts = useToasts;

// --- Sortable table hook ---
function useSort(rows, defaultKey) {
  const [sort, setSort] = useState({ key: defaultKey, dir: "asc" });
  const sorted = useMemo(() => {
    if (!sort.key) return rows;
    const out = [...rows].sort((a, b) => {
      const av = a[sort.key], bv = b[sort.key];
      if (typeof av === "string") return av.localeCompare(bv);
      return (av || 0) - (bv || 0);
    });
    return sort.dir === "desc" ? out.reverse() : out;
  }, [rows, sort]);
  const onSort = (k) => setSort(s => s.key === k ? { key: k, dir: s.dir === "asc" ? "desc" : "asc" } : { key: k, dir: "asc" });
  return [sorted, sort, onSort];
}
window.useSort = useSort;

// --- random walk for live charts ---
function makeWalk(n, mid, amp) {
  const out = [];
  let v = mid;
  for (let i = 0; i < n; i++) {
    v += (Math.random() - 0.5) * amp * 2;
    v = Math.max(mid * 0.4, Math.min(mid * 1.8, v));
    out.push(Math.round(v));
  }
  return out;
}
window.makeWalk = makeWalk;
