// topic-detail.jsx — single topic detail with tabs

const { useState: tdS, useEffect: tdE, useMemo: tdM, useRef: tdR, useCallback: tdC } = React;

function TopicDetailPage({ topicName, setRoute, openProduce, tweaks }) {
  const topic = KAFKA_DATA.TOPICS.find(t => t.name === topicName) || KAFKA_DATA.TOPICS[0];
  const [tab, setTab] = tdS("messages");
  const [confirmDel, setConfirmDel] = tdS(false);

  return (
    <div className="page">
      <div className="page-h">
        <div style={{ minWidth: 0 }}>
          <div className="row" style={{ gap: 8, color: "var(--fg-3)", fontSize: 12, marginBottom: 4, cursor: "pointer" }} onClick={() => setRoute({ page: "topics" })}>
            <I.chevLeft size={12}/> All topics
          </div>
          <div className="row" style={{ gap: 10 }}>
            <h1 style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 600 }}>{topic.name}</h1>
            <StatusBadge state={topic.status === "internal" ? "internal" : topic.status}/>
            {topic.config.cleanup === "compact" && <span className="badge">compact</span>}
          </div>
          <div className="sub row" style={{ gap: 14, marginTop: 6 }}>
            <span><span className="muted">Partitions</span> <span className="mono tabnum">{topic.partitions}</span></span>
            <span><span className="muted">RF</span> <span className="mono tabnum">{topic.rf}</span></span>
            <span><span className="muted">Messages</span> <span className="mono tabnum">{fmt.numFull(topic.msgs)}</span></span>
            <span><span className="muted">Size</span> <span className="mono tabnum">{fmt.bytes(topic.size)}</span></span>
            <span><span className="muted">Retention</span> <span className="mono tabnum">{fmt.ms(topic.retentionMs)}</span></span>
            <span><span className="muted">Owner</span> <span>{topic.owner}</span></span>
          </div>
        </div>
        <div className="row">
          <button className="btn"><I.copy size={12}/> Copy name</button>
          <button className="btn" data-variant="primary" onClick={() => openProduce(topic.name)}><I.send size={13}/> Produce</button>
          <button className="btn" data-variant="danger" onClick={() => setConfirmDel(true)}><I.trash size={12}/> Delete</button>
        </div>
      </div>

      <div className="tabs">
        {[
          ["overview", "Overview"],
          ["messages", "Messages"],
          ["consumers", "Consumers", topic.lag > 0 ? <span className="badge" data-tone="amber" key="b">lag</span> : null],
          ["config", "Configuration"],
          ["partitions", "Partitions"],
          ["acls", "ACLs"],
        ].map(([k, l, b]) => (
          <button key={k} className="tab" data-active={tab === k} onClick={() => setTab(k)}>
            {l}{b}
          </button>
        ))}
      </div>

      {tab === "overview" && <TopicOverview topic={topic} tweaks={tweaks}/>}
      {tab === "messages" && <MessageBrowser topic={topic} tweaks={tweaks}/>}
      {tab === "consumers" && <TopicConsumers topic={topic}/>}
      {tab === "config" && <TopicConfig topic={topic}/>}
      {tab === "partitions" && <TopicPartitions topic={topic}/>}
      {tab === "acls" && <TopicAcls topic={topic}/>}

      <ConfirmModal
        open={confirmDel} onClose={() => setConfirmDel(false)}
        title="Delete topic"
        confirmLabel="Delete topic"
        confirmText={topic.name}
        body={<>This will permanently delete <span className="mono" style={{ color: "var(--fg)" }}>{topic.name}</span> and all <span className="mono">{fmt.numFull(topic.msgs)}</span> messages across <span className="mono">{topic.partitions}</span> partitions. <strong>This cannot be undone.</strong></>}
      />
    </div>
  );
}

function TopicOverview({ topic, tweaks }) {
  const [series, setSeries] = tdS(() => makeWalk(60, topic.throughput, topic.throughput * 0.15));
  tdE(() => {
    if (!tweaks.liveAnim) return;
    const t = setInterval(() => setSeries(s => [...s.slice(1), Math.max(topic.throughput*0.5, Math.min(topic.throughput*1.6, s[s.length-1] + (Math.random()-0.5)*topic.throughput*0.08))]), 1500);
    return () => clearInterval(t);
  }, [tweaks.liveAnim]);
  const last = series[series.length-1];
  return (
    <>
      <div className="kpi-row" style={{ marginBottom: 14 }}>
        <KpiTileSimple label="Throughput in" val={fmt.rate(last)} sub="msg/s"/>
        <KpiTileSimple label="Bytes in" val={(last * 0.5 / 1024).toFixed(1) + " MB/s"}/>
        <KpiTileSimple label="Total lag" val={fmt.numFull(topic.lag)} sub="msgs" tone={topic.lag > 10000 ? "red" : topic.lag > 100 ? "amber" : null}/>
        <KpiTileSimple label="Avg msg size" val="487 B"/>
        <KpiTileSimple label="Min ISR" val="2"/>
        <KpiTileSimple label="Compression" val={topic.config.compression || "—"}/>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-h">
            <h3>Throughput · last 60s</h3>
            <span className="mono tabnum flash" key={last} style={{ fontSize: 12 }}>{fmt.rate(last)}</span>
          </div>
          <div className="card-b" style={{ paddingBottom: 6 }}>
            <AreaChart data={series} yAxis height={170}/>
          </div>
        </div>
        <div className="card">
          <div className="card-h"><h3>Partition leadership</h3></div>
          <div style={{ padding: 14, display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 6 }}>
            {Array.from({ length: Math.min(topic.partitions, 32) }).map((_, i) => {
              const leader = 1001 + (i % 6);
              const tone = i === 11 || i === 18 || i === 22 ? "amber" : "green";
              return (
                <div key={i} title={`Partition ${i} → leader ${leader}`}
                     style={{
                       background: tone === "amber" ? "var(--amber-bg)" : "var(--bg-2)",
                       border: `1px solid ${tone === "amber" ? "color-mix(in oklab, var(--amber) 35%, transparent)" : "var(--border)"}`,
                       borderRadius: 4, padding: "6px 4px",
                       textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 10.5,
                       color: tone === "amber" ? "var(--amber)" : "var(--fg-2)",
                     }}>
                  P{i}
                  <div style={{ fontSize: 9, color: "var(--fg-4)", marginTop: 2 }}>{leader}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

function KpiTileSimple({ label, val, sub, tone }) {
  return (
    <div className="kpi" style={{ gap: 4 }}>
      <div className="label">{label}</div>
      <div className="row" style={{ alignItems: "baseline", gap: 6 }}>
        <div className="val mono" style={{ fontSize: 18, color: tone === "red" ? "var(--red)" : tone === "amber" ? "var(--amber)" : "inherit" }}>{val}</div>
        {sub && <span className="muted" style={{ fontSize: 11 }}>{sub}</span>}
      </div>
    </div>
  );
}

// ============== MESSAGE BROWSER ==============
function MessageBrowser({ topic, tweaks }) {
  const [paused, setPaused] = tdS(false);
  const [tail, setTail] = tdS(true);
  const [partition, setPartition] = tdS("all");
  const [filter, setFilter] = tdS("");
  const [messages, setMessages] = tdS(() => KAFKA_DATA.makeMessages(topic.name, 32));
  const [selected, setSelected] = tdS(null);

  tdE(() => {
    if (!tail || paused || !tweaks.liveAnim) return;
    const t = setInterval(() => {
      setMessages(m => {
        const fresh = KAFKA_DATA.makeMessages(topic.name, 1)[0];
        fresh.offset = m[0].offset + 1;
        fresh.ts = Date.now();
        fresh._new = true;
        return [fresh, ...m.slice(0, 39)];
      });
    }, 1400);
    return () => clearInterval(t);
  }, [tail, paused, tweaks.liveAnim]);

  const filtered = uM(() => messages.filter(m => {
    if (partition !== "all" && m.partition !== +partition) return false;
    if (filter && !JSON.stringify(m.value).toLowerCase().includes(filter.toLowerCase()) && !m.key.includes(filter)) return false;
    return true;
  }), [messages, partition, filter]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 480px" : "1fr", gap: 14 }}>
      <div className="tbl-wrap">
        <div className="tbl-toolbar">
          <button className="btn" data-size="sm" data-variant={paused ? "primary" : ""} onClick={() => setPaused(p => !p)}>
            {paused ? <><I.play size={12}/> Resume</> : <><I.pause size={12}/> Pause</>}
          </button>
          <label className="row" style={{ gap: 6, fontSize: 12, padding: "0 6px" }}>
            <input type="checkbox" className="tgl" checked={tail} onChange={e => setTail(e.target.checked)}/>
            <span className="row" style={{ gap: 4 }}>Live tail{tail && tweaks.liveAnim && <span className="sdot" data-tone="green" style={{ marginLeft: 2 }}/>}</span>
          </label>
          <div style={{ height: 18, width: 1, background: "var(--border)" }}/>
          <select className="select" style={{ width: 130, height: 24 }} value={partition} onChange={e => setPartition(e.target.value)}>
            <option value="all">All partitions</option>
            {Array.from({ length: Math.min(topic.partitions, 16) }).map((_, i) => <option key={i} value={i}>Partition {i}</option>)}
          </select>
          <div className="input-group" style={{ width: 240, height: 24 }}>
            <I.search size={12}/>
            <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter by key, value, header..."/>
          </div>
          <div className="grow"/>
          <span className="muted" style={{ fontSize: 12 }} className="mono tabnum">{filtered.length} msgs · offset {fmt.numFull(messages[0]?.offset)}</span>
          <button className="btn" data-size="sm" data-variant="ghost"><I.download size={12}/> Export</button>
        </div>
        <div className="tbl-scroll" style={{ maxHeight: 560, overflowY: "auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 60 }}>P</th>
                <th>Offset</th>
                <th>Timestamp</th>
                <th>Key</th>
                <th>Value (preview)</th>
                <th className="num">Size</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.offset} className={m._new ? "tail-new" : ""} data-active={selected?.offset === m.offset}
                    onClick={() => setSelected(m)}>
                  <td className="mono tabnum" style={{ color: "var(--fg-3)" }}>P{m.partition}</td>
                  <td className="mono tabnum">{fmt.numFull(m.offset)}</td>
                  <td className="mono" style={{ color: "var(--fg-3)" }}>{fmt.time(m.ts)}</td>
                  <td className="mono" style={{ color: "var(--accent)", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis" }}>{m.key}</td>
                  <td className="mono" style={{ color: "var(--fg-2)", maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {`{order_id:"${m.value.order_id}", items:${m.value.items}, total_cents:${m.value.total_cents}, status:"${m.value.status}"}`}
                  </td>
                  <td className="num mono tabnum muted">{m.size}B</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="card" style={{ alignSelf: "flex-start", position: "sticky", top: 0 }}>
          <div className="card-h">
            <div>
              <h3>Message detail</h3>
              <div className="sub mono">P{selected.partition} · offset {fmt.numFull(selected.offset)}</div>
            </div>
            <button className="iconbtn" onClick={() => setSelected(null)}><I.close size={14}/></button>
          </div>
          <div style={{ padding: 14, borderBottom: "1px solid var(--border)", display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 14px", fontSize: 12 }}>
            <span className="muted">Timestamp</span><span className="mono">{new Date(selected.ts).toISOString()}</span>
            <span className="muted">Key</span><span className="mono" style={{ color: "var(--accent)" }}>{selected.key}</span>
            <span className="muted">Size</span><span className="mono">{selected.size} B</span>
            <span className="muted">Headers</span>
            <div className="mono" style={{ fontSize: 11.5 }}>
              {Object.entries(selected.headers).map(([k, v]) => <div key={k}><span style={{ color: "var(--fg-3)" }}>{k}:</span> {v}</div>)}
            </div>
          </div>
          <div style={{ padding: "8px 14px", borderBottom: "1px solid var(--border)", display: "flex", gap: 4 }}>
            <button className="tab" data-active={true} style={{ padding: "6px 10px", fontSize: 12 }}>JSON</button>
            <button className="tab" style={{ padding: "6px 10px", fontSize: 12 }}>Avro</button>
            <button className="tab" style={{ padding: "6px 10px", fontSize: 12 }}>Raw</button>
            <div style={{ flex: 1 }}/>
            <button className="iconbtn" data-size="sm" title="Copy"><I.copy size={12}/></button>
            <button className="iconbtn" data-size="sm" title="Reproduce"><I.send size={12}/></button>
          </div>
          <div style={{ maxHeight: 360, overflow: "auto" }}>
            <JsonViewer data={selected.value}/>
          </div>
        </div>
      )}
    </div>
  );
}

function TopicConsumers({ topic }) {
  const groups = KAFKA_DATA.CONSUMER_GROUPS.filter(g => g.topic === topic.name);
  if (groups.length === 0) return <Empty icon="consumers" title="No consumer groups" body="Nothing is consuming from this topic yet."/>;
  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead>
          <tr>
            <th>Group ID</th>
            <th>State</th>
            <th className="num">Members</th>
            <th className="num">Lag</th>
            <th>Protocol</th>
            <th className="num">Coordinator</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {groups.map(g => (
            <tr key={g.id}>
              <td className="mono">{g.id}</td>
              <td><StatusBadge state={g.state}/></td>
              <td className="num mono tabnum">{g.members}</td>
              <td className="num"><LagIndicator lag={g.lag}/></td>
              <td className="mono muted">{g.protocol}</td>
              <td className="num mono tabnum">{g.coordinator}</td>
              <td><button className="iconbtn" data-size="sm"><I.external size={12}/></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TopicConfig({ topic }) {
  const configs = [
    ["cleanup.policy", topic.config.cleanup, "default", "How segments are reclaimed"],
    ["retention.ms", String(topic.retentionMs), "override", "Max age of messages before cleanup"],
    ["retention.bytes", "-1", "default", "Max size before cleanup"],
    ["compression.type", topic.config.compression || "producer", "override", "Compression codec for this topic"],
    ["min.insync.replicas", "2", "default", "Min replicas in-sync for ack=all writes"],
    ["segment.ms", "604800000", "default", "Segment roll period"],
    ["max.message.bytes", "1048588", "default", "Max single message size"],
    ["unclean.leader.election.enable", "false", "default", "Allow out-of-sync replicas to lead"],
    ["delete.retention.ms", "86400000", "default", "Tombstone retention for compacted topics"],
  ];
  return (
    <div className="tbl-wrap">
      <div className="tbl-toolbar">
        <div className="input-group" style={{ width: 240 }}>
          <I.search size={13}/><input placeholder="Filter configs..."/>
        </div>
        <label className="row" style={{ gap: 6, fontSize: 12, color: "var(--fg-3)" }}>
          <input type="checkbox" className="chk"/>Only show overrides
        </label>
        <div className="grow"/>
        <button className="btn" data-size="sm"><I.edit size={12}/> Edit configs</button>
      </div>
      <table className="tbl">
        <thead>
          <tr>
            <th>Property</th>
            <th>Value</th>
            <th>Source</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {configs.map(([k, v, src, desc]) => (
            <tr key={k}>
              <td className="mono" style={{ color: "var(--fg)" }}>{k}</td>
              <td className="mono">{v}</td>
              <td>{src === "override" ? <span className="badge" data-tone="accent">override</span> : <span className="muted" style={{ fontSize: 11.5 }}>default</span>}</td>
              <td className="muted" style={{ fontSize: 12, whiteSpace: "normal" }}>{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TopicPartitions({ topic }) {
  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead>
          <tr>
            <th className="num">P</th>
            <th className="num">Leader</th>
            <th>Replicas</th>
            <th>ISR</th>
            <th className="num">Begin offset</th>
            <th className="num">End offset</th>
            <th className="num">Size</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: Math.min(topic.partitions, 16) }).map((_, i) => {
            const urp = i === 11 || i === 14;
            return (
              <tr key={i}>
                <td className="num mono tabnum">P{i}</td>
                <td className="num mono tabnum">{1001 + (i % 6)}</td>
                <td className="mono">[{[1001+(i%6), 1001+((i+1)%6), 1001+((i+2)%6)].join(",")}]</td>
                <td className="mono">{urp ? <span style={{ color: "var(--amber)" }}>[{1001+(i%6)},{1001+((i+1)%6)}]</span> : <span>[{[1001+(i%6), 1001+((i+1)%6), 1001+((i+2)%6)].join(",")}]</span>}</td>
                <td className="num mono tabnum muted">{fmt.numFull(4821030400 + i*1840000)}</td>
                <td className="num mono tabnum">{fmt.numFull(4823184201 + i*1840000)}</td>
                <td className="num mono tabnum">{(topic.size/topic.partitions).toFixed(1)} MB</td>
                <td>{urp ? <span className="badge" data-tone="amber">URP</span> : <span className="badge" data-tone="green"><span className="ico"/>OK</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TopicAcls({ topic }) {
  const acls = KAFKA_DATA.ACLS.filter(a => a.resource.includes(topic.name.split(".")[0]) || a.resource.includes(topic.name));
  return acls.length ? (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead><tr><th>Principal</th><th>Operation</th><th>Permission</th><th>Host</th><th>Pattern</th></tr></thead>
        <tbody>
          {acls.map((a, i) => (
            <tr key={i}>
              <td className="mono">{a.principal}</td>
              <td><span className="mono">{a.op}</span></td>
              <td>{a.perm === "Allow" ? <span className="badge" data-tone="green">Allow</span> : <span className="badge" data-tone="red">Deny</span>}</td>
              <td className="mono muted">{a.host}</td>
              <td className="muted">{a.pattern}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : <Empty icon="acls" title="No ACLs configured" body="This topic is using cluster-wide defaults." cta="Add ACL"/>;
}

function Empty({ icon, title, body, cta }) {
  const Ico = I[icon] || I.info;
  return (
    <div className="empty">
      <div className="ico"><Ico size={18}/></div>
      <h4>{title}</h4>
      <p>{body}</p>
      {cta && <button className="btn" style={{ marginTop: 8 }}><I.plus size={12}/>{cta}</button>}
    </div>
  );
}
window.Empty = Empty;

// ============== CONFIRM MODAL (type-to-confirm) ==============
function ConfirmModal({ open, onClose, title, body, confirmLabel, confirmText, onConfirm }) {
  const [typed, setTyped] = tdS("");
  tdE(() => { if (open) setTyped(""); }, [open]);
  const ok = typed === confirmText;
  return (
    <Modal open={open} onClose={onClose}>
      <div className="modal-h">
        <div className="icon-pill"><I.warning size={16}/></div>
        <div style={{ flex: 1 }}>
          <h3>{title}</h3>
          <p>{body}</p>
        </div>
        <button className="iconbtn" onClick={onClose}><I.close size={14}/></button>
      </div>
      <div className="modal-b">
        <label className="lbl">To confirm, type <span className="mono" style={{ color: "var(--fg)", background: "var(--bg-3)", padding: "1px 5px", borderRadius: 3 }}>{confirmText}</span> below</label>
        <input className="input mono" value={typed} onChange={e => setTyped(e.target.value)} placeholder={confirmText} autoFocus/>
      </div>
      <div className="modal-f">
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn" data-variant="danger" disabled={!ok} onClick={() => { onConfirm?.(); onClose(); }}>
          <I.trash size={12}/> {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
window.ConfirmModal = ConfirmModal;
window.TopicDetailPage = TopicDetailPage;
