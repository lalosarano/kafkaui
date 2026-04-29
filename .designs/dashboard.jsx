// dashboard.jsx — cluster overview screen

const { useState: useStateD, useEffect: useEffectD, useMemo: useMemoD } = React;

function KpiTile({ label, val, sub, sparkData, sparkColor, trend, delta }) {
  return (
    <div className="kpi" style={{ gap: 4 }}>
      <div className="label">{label}</div>
      <div className="row" style={{ alignItems: "baseline", gap: 8 }}>
        <div className="val">{val}</div>
        {sub && <span className="muted" style={{ fontSize: 12 }}>{sub}</span>}
      </div>
      {delta && <div className="delta" data-trend={trend}>
        {trend === "up" ? <I.arrowUp size={11}/> : trend === "down" ? <I.arrowDown size={11}/> : null}
        {delta}
      </div>}
      {sparkData && <div style={{ marginTop: 6, marginLeft: -2 }}><Sparkline data={sparkData} color={sparkColor || "var(--accent)"} animated/></div>}
    </div>
  );
}

function DashboardPage({ tweaks, setRoute, openProduce }) {
  const [inSeries, setInSeries] = useStateD(() => makeWalk(60, 142000, 8000));
  const [outSeries, setOutSeries] = useStateD(() => makeWalk(60, 138000, 7000));
  const [bytesIn, setBytesIn] = useStateD(() => makeWalk(60, 84, 6));
  const [bytesOut, setBytesOut] = useStateD(() => makeWalk(60, 78, 5));

  useEffectD(() => {
    if (!tweaks.liveAnim) return;
    const t = setInterval(() => {
      setInSeries(s => [...s.slice(1), Math.max(120000, Math.min(180000, s[s.length-1] + (Math.random()-0.5)*4000))]);
      setOutSeries(s => [...s.slice(1), Math.max(115000, Math.min(170000, s[s.length-1] + (Math.random()-0.5)*4000))]);
      setBytesIn(s => [...s.slice(1), Math.max(70, Math.min(95, s[s.length-1] + (Math.random()-0.5)*3))]);
      setBytesOut(s => [...s.slice(1), Math.max(65, Math.min(90, s[s.length-1] + (Math.random()-0.5)*3))]);
    }, 1500);
    return () => clearInterval(t);
  }, [tweaks.liveAnim]);

  const lastIn = inSeries[inSeries.length-1];
  const lastOut = outSeries[outSeries.length-1];
  const lastBin = bytesIn[bytesIn.length-1];
  const lastBout = bytesOut[bytesOut.length-1];

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>prod-use1 <span className="badge" data-tone="green" style={{ verticalAlign: "middle", marginLeft: 8 }}><span className="ico"/>Healthy</span></h1>
          <div className="sub">3.7.0 · 6 brokers · controller <span className="mono">1001</span> · last refreshed {fmt.ago(Date.now()-12000)}</div>
        </div>
        <div className="row">
          <button className="btn"><I.refresh size={13}/> Refresh</button>
          <button className="btn" data-variant="primary" onClick={openProduce}><I.send size={13}/> Produce message</button>
        </div>
      </div>

      {/* KPI row */}
      <div className="kpi-row" style={{ marginBottom: 14 }}>
        <KpiTile label="Brokers" val="6" sub="online" delta="all in-sync" trend="up"/>
        <KpiTile label="Topics" val="18" sub="2 internal"/>
        <KpiTile label="Partitions" val="438" sub="1,314 replicas"/>
        <KpiTile label="Under-replicated" val="3" trend="down" delta="from 7 yesterday" sparkData={[7,6,6,5,5,4,4,4,3,3,3]} sparkColor="var(--amber)"/>
        <KpiTile label="Offline partitions" val="0" trend="up" delta="all healthy"/>
        <KpiTile label="Active controllers" val="1" sub={<span className="mono">broker 1001</span>}/>
      </div>

      {/* Charts row */}
      <div className="grid-2" style={{ marginBottom: 14 }}>
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Messages / sec</h3>
              <div className="sub">Cluster-wide throughput · last 60s</div>
            </div>
            <div className="row" style={{ gap: 8, fontSize: 11.5 }}>
              <span className="row" style={{ gap: 4 }}><span className="sdot" style={{ background: "var(--accent)" }}/>In <span className="mono tabnum flash" key={lastIn}>{fmt.num(lastIn)}/s</span></span>
              <span className="row" style={{ gap: 4 }}><span className="sdot" style={{ background: "var(--violet)" }}/>Out <span className="mono tabnum flash" key={lastOut}>{fmt.num(lastOut)}/s</span></span>
            </div>
          </div>
          <div className="card-b" style={{ paddingBottom: 6 }}>
            <DualAreaChart data1={inSeries} data2={outSeries} color1="var(--accent)" color2="var(--violet)"/>
          </div>
        </div>
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Bytes / sec</h3>
              <div className="sub">MB/s in & out · last 60s</div>
            </div>
            <div className="row" style={{ gap: 8, fontSize: 11.5 }}>
              <span className="row" style={{ gap: 4 }}><span className="sdot" style={{ background: "var(--accent)" }}/>In <span className="mono tabnum flash" key={lastBin}>{lastBin.toFixed(1)} MB/s</span></span>
              <span className="row" style={{ gap: 4 }}><span className="sdot" style={{ background: "var(--violet)" }}/>Out <span className="mono tabnum flash" key={lastBout}>{lastBout.toFixed(1)} MB/s</span></span>
            </div>
          </div>
          <div className="card-b" style={{ paddingBottom: 6 }}>
            <DualAreaChart data1={bytesIn} data2={bytesOut} color1="var(--accent)" color2="var(--violet)"/>
          </div>
        </div>
      </div>

      {/* Brokers + alerts */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 14, marginBottom: 14 }}>
        <div className="card">
          <div className="card-h">
            <h3>Brokers</h3>
            <button className="btn" data-variant="ghost" data-size="sm" onClick={() => setRoute({ page: "brokers" })}>View all <I.arrowRight size={11}/></button>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>ID</th>
                <th>Host</th>
                <th>Rack</th>
                <th>Role</th>
                <th className="num">Partitions</th>
                <th className="num">Disk</th>
                <th className="num">CPU</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {KAFKA_DATA.BROKERS.map(b => (
                <tr key={b.id}>
                  <td className="mono">{b.id}</td>
                  <td className="mono" style={{ color: "var(--fg-2)" }}>{b.host}</td>
                  <td className="mono muted">{b.rack}</td>
                  <td>{b.role === "controller" ? <span className="badge" data-tone="accent">controller</span> : <span className="muted">broker</span>}</td>
                  <td className="num mono tabnum">{b.partitions} <span className="dim">/{b.leaders}L</span></td>
                  <td className="num"><DiskBar pct={b.disk}/></td>
                  <td className="num mono tabnum" style={{ color: b.cpu > 70 ? "var(--amber)" : "inherit" }}>{b.cpu}%</td>
                  <td><StatusBadge state={b.status}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-h">
            <h3>Alerts</h3>
            <span className="badge" data-tone="amber">{KAFKA_DATA.ALERTS.filter(a => a.sev !== "info").length} active</span>
          </div>
          <div>
            {KAFKA_DATA.ALERTS.map((a, i) => (
              <div key={i} style={{ padding: "10px 14px", borderBottom: i < KAFKA_DATA.ALERTS.length-1 ? "1px solid var(--border-soft)" : "none", display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ marginTop: 2, color: a.sev === "error" ? "var(--red)" : a.sev === "warning" ? "var(--amber)" : "var(--fg-3)" }}>
                  {a.sev === "info" ? <I.info size={14}/> : <I.warning size={14}/>}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500 }}>{a.title}</div>
                  <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{a.body}</div>
                  <div style={{ display: "flex", gap: 10, marginTop: 6, fontSize: 11, color: "var(--fg-4)" }}>
                    <span>{a.ts}</span>
                    <span className="mono">{a.resource}</span>
                  </div>
                </div>
                <button className="iconbtn" data-size="sm"><I.external size={12}/></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top topics */}
      <div className="card">
        <div className="card-h">
          <h3>Top topics by throughput</h3>
          <button className="btn" data-variant="ghost" data-size="sm" onClick={() => setRoute({ page: "topics" })}>View all <I.arrowRight size={11}/></button>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Topic</th>
              <th className="num">Partitions</th>
              <th className="num">Throughput</th>
              <th className="num">Size</th>
              <th className="num">Lag</th>
              <th>Last 60s</th>
            </tr>
          </thead>
          <tbody>
            {KAFKA_DATA.TOPICS.filter(t => !t.system).sort((a,b) => b.throughput - a.throughput).slice(0,5).map(t => (
              <tr key={t.name} onClick={() => setRoute({ page: "topics", topic: t.name })}>
                <td className="mono" style={{ color: "var(--fg)" }}>{t.name}</td>
                <td className="num mono tabnum">{t.partitions}</td>
                <td className="num mono tabnum">{fmt.rate(t.throughput)}</td>
                <td className="num mono tabnum">{fmt.bytes(t.size)}</td>
                <td className="num"><LagIndicator lag={t.lag}/></td>
                <td style={{ width: 140 }}><Sparkline data={makeWalk(20, t.throughput, t.throughput*0.15)} color={t.status === "warning" ? "var(--amber)" : "var(--accent)"}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DualAreaChart({ data1, data2, color1, color2, height = 160 }) {
  const ref = useRef(null);
  const [w, setW] = useState(400);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  const max = Math.max(...data1, ...data2, 1);
  const padL = 44, padR = 12, padT = 10, padB = 22;
  const chartW = w - padL - padR, chartH = height - padT - padB;
  const step = chartW / (data1.length - 1 || 1);
  const mkPath = (d) => d.map((v, i) => (i === 0 ? "M" : "L") + (padL + i*step).toFixed(1) + "," + (padT + chartH - (v/max)*chartH).toFixed(1)).join(" ");
  const mkFill = (d) => mkPath(d) + ` L${padL + chartW},${padT + chartH} L${padL},${padT + chartH} Z`;
  const ticks = [0, 0.5, 1].map(t => max * t);
  return (
    <svg ref={ref} width={w} height={height} style={{ display: "block", width: "100%" }}>
      {ticks.map((t, i) => {
        const y = padT + chartH - (t / max) * chartH;
        return <g key={i}>
          <line x1={padL} x2={w - padR} y1={y} y2={y} stroke="var(--border-soft)" strokeDasharray={i === 0 ? "0" : "2 3"}/>
          <text x={padL - 8} y={y + 3} textAnchor="end" fontSize="10" fill="var(--fg-3)" fontFamily="var(--font-mono)">{fmt.num(Math.round(t))}</text>
        </g>;
      })}
      <path d={mkFill(data1)} fill={color1} opacity="0.10"/>
      <path d={mkPath(data1)} fill="none" stroke={color1} strokeWidth="1.5"/>
      <path d={mkFill(data2)} fill={color2} opacity="0.10"/>
      <path d={mkPath(data2)} fill="none" stroke={color2} strokeWidth="1.5"/>
    </svg>
  );
}

function DiskBar({ pct }) {
  const tone = pct > 80 ? "var(--red)" : pct > 70 ? "var(--amber)" : "var(--accent)";
  return (
    <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}>
      <div style={{ width: 50, height: 4, background: "var(--bg-3)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: pct + "%", height: "100%", background: tone }}/>
      </div>
      <span className="mono tabnum" style={{ fontSize: 11.5, color: pct > 80 ? "var(--red)" : pct > 70 ? "var(--amber)" : "var(--fg-2)", minWidth: 28, textAlign: "right" }}>{pct}%</span>
    </div>
  );
}
window.DiskBar = DiskBar;
window.DashboardPage = DashboardPage;
