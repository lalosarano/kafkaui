// other-pages.jsx — consumer groups, schemas, ACLs, brokers, settings, produce modal

const { useState: opS, useEffect: opE, useMemo: opM } = React;

// ============ CONSUMER GROUPS ============
function ConsumersPage({ setRoute, route }) {
  const [q, setQ] = opS("");
  const [stateFilter, setStateFilter] = opS("all");
  const groups = opM(() => KAFKA_DATA.CONSUMER_GROUPS.filter(g =>
    (stateFilter === "all" || g.state === stateFilter) &&
    g.id.toLowerCase().includes(q.toLowerCase())
  ), [q, stateFilter]);
  const [sorted, sort, onSort] = useSort(groups, "lag");

  const detail = route.group ? KAFKA_DATA.CONSUMER_GROUPS.find(g => g.id === route.group) : null;

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Consumer groups</h1>
          <div className="sub">{KAFKA_DATA.CONSUMER_GROUPS.length} groups · 1 dead · 1 rebalancing</div>
        </div>
        <div className="row">
          <button className="btn"><I.refresh size={13}/> Refresh</button>
        </div>
      </div>

      <div className="kpi-row" style={{ marginBottom: 14 }}>
        <KpiTileSimple label="Stable" val={KAFKA_DATA.CONSUMER_GROUPS.filter(g => g.state === "stable").length} sub="groups"/>
        <KpiTileSimple label="Rebalancing" val={KAFKA_DATA.CONSUMER_GROUPS.filter(g => g.state === "rebalancing").length} tone="amber"/>
        <KpiTileSimple label="Empty" val={KAFKA_DATA.CONSUMER_GROUPS.filter(g => g.state === "empty").length}/>
        <KpiTileSimple label="Dead" val={KAFKA_DATA.CONSUMER_GROUPS.filter(g => g.state === "dead").length} tone="red"/>
        <KpiTileSimple label="Total lag" val={fmt.num(KAFKA_DATA.CONSUMER_GROUPS.reduce((a, g) => a + g.lag, 0))} sub="msgs"/>
      </div>

      <div className="tbl-wrap">
        <div className="tbl-toolbar">
          <div className="input-group" style={{ width: 280 }}>
            <I.search size={13}/><input value={q} onChange={e => setQ(e.target.value)} placeholder="Filter by group ID..."/>
          </div>
          <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: 6, padding: 1, gap: 0 }}>
            {["all", "stable", "rebalancing", "empty", "dead"].map(s => (
              <button key={s} onClick={() => setStateFilter(s)}
                      style={{
                        padding: "3px 10px", fontSize: 11.5, textTransform: "capitalize",
                        background: stateFilter === s ? "var(--bg-active)" : "transparent",
                        color: stateFilter === s ? "var(--fg)" : "var(--fg-3)",
                        border: 0, borderRadius: 4, cursor: "pointer", fontFamily: "inherit"
                      }}>
                {s}
              </button>
            ))}
          </div>
          <div className="grow"/>
          <span className="muted" style={{ fontSize: 12 }}>{sorted.length} groups</span>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <SortHead k="id" sort={sort} onSort={onSort}>Group ID</SortHead>
              <th>State</th>
              <SortHead k="members" sort={sort} onSort={onSort} num>Members</SortHead>
              <SortHead k="topic" sort={sort} onSort={onSort}>Topic</SortHead>
              <SortHead k="lag" sort={sort} onSort={onSort} num>Lag</SortHead>
              <th>Protocol</th>
              <th className="num">Coordinator</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(g => (
              <tr key={g.id} onClick={() => setRoute({ page: "consumers", group: g.id })}>
                <td className="mono" style={{ color: "var(--fg)" }}>{g.id}</td>
                <td><StatusBadge state={g.state}/></td>
                <td className="num mono tabnum">{g.members}</td>
                <td className="mono muted">{g.topic}</td>
                <td className="num"><LagIndicator lag={g.lag}/></td>
                <td className="mono muted" style={{ fontSize: 11.5 }}>{g.protocol}</td>
                <td className="num mono tabnum">{g.coordinator}</td>
                <td onClick={e => e.stopPropagation()}>
                  <div className="row-actions">
                    <button className="iconbtn" data-size="sm" title="Reset offsets"><I.rotate size={12}/></button>
                    <button className="iconbtn" data-size="sm"><I.more size={12}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConsumerDrawer group={detail} onClose={() => setRoute({ page: "consumers" })}/>
    </div>
  );
}

function ConsumerDrawer({ group, onClose }) {
  const open = !!group;
  const [resetOpen, setResetOpen] = opS(false);
  if (!group) return <div className="drawer-overlay" data-open={false}/>;
  const partitions = Array.from({ length: 8 }).map((_, i) => ({
    p: i,
    member: group.members > 0 ? `consumer-${(i % group.members) + 1}-${Math.random().toString(36).slice(2, 8)}` : null,
    currentOffset: 4823184201 + i * 1840000 - Math.floor(group.lag / 8),
    endOffset: 4823184201 + i * 1840000,
    lag: group.state === "dead" ? Math.floor(group.lag / 8) : group.lag === 0 ? 0 : Math.floor(group.lag * (0.5 + Math.random())),
    host: `10.0.${24 + i}.${100 + i}`,
  }));
  return (
    <>
      <div className="drawer-overlay" data-open={open} onClick={onClose}/>
      <div className="drawer" data-open={open}>
        <div className="drawer-h">
          <button className="iconbtn" onClick={onClose}><I.close size={14}/></button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="row" style={{ gap: 10 }}>
              <h2 className="title-mono">{group.id}</h2>
              <StatusBadge state={group.state}/>
            </div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>
              {group.members} members · topic <span className="mono">{group.topic}</span> · coordinator <span className="mono">{group.coordinator}</span> · {group.protocol}
            </div>
          </div>
          <button className="btn" data-size="sm"><I.rotate size={12}/> Reset offsets</button>
          <button className="btn" data-size="sm" data-variant="danger" onClick={() => setResetOpen(true)}><I.power size={12}/> Delete group</button>
        </div>
        <div className="drawer-b">
          <div style={{ padding: 14 }}>
            <div className="kpi-row">
              <KpiTileSimple label="Members" val={group.members}/>
              <KpiTileSimple label="Total lag" val={fmt.numFull(group.lag)} tone={group.lag > 10000 ? "red" : group.lag > 100 ? "amber" : null}/>
              <KpiTileSimple label="Lag %" val={(group.lagPct * 100).toFixed(3) + "%"}/>
              <KpiTileSimple label="Assigned partitions" val={partitions.length}/>
            </div>
          </div>
          <div style={{ padding: "0 14px 14px" }}>
            <div className="tbl-wrap">
              <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)", background: "var(--bg-2)", fontSize: 12, fontWeight: 500 }}>Partition assignments & lag</div>
              <table className="tbl">
                <thead>
                  <tr>
                    <th className="num">P</th>
                    <th>Member</th>
                    <th>Host</th>
                    <th className="num">Current offset</th>
                    <th className="num">End offset</th>
                    <th className="num">Lag</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {partitions.map(p => (
                    <tr key={p.p}>
                      <td className="num mono tabnum">P{p.p}</td>
                      <td className="mono" style={{ fontSize: 11.5 }}>{p.member || <span className="muted">— no member —</span>}</td>
                      <td className="mono muted">{p.host}</td>
                      <td className="num mono tabnum">{fmt.numFull(p.currentOffset)}</td>
                      <td className="num mono tabnum muted">{fmt.numFull(p.endOffset)}</td>
                      <td className="num"><LagIndicator lag={p.lag}/></td>
                      <td><button className="iconbtn" data-size="sm" title="Reset partition offset"><I.rotate size={12}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <ResetOffsetsModal open={resetOpen} onClose={() => setResetOpen(false)} group={group}/>
    </>
  );
}

function ResetOffsetsModal({ open, onClose, group }) {
  const [strategy, setStrategy] = opS("earliest");
  if (!group) return null;
  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="modal-h">
        <div className="icon-pill"><I.warning size={16}/></div>
        <div style={{ flex: 1 }}>
          <h3>Reset offsets for {group.id}</h3>
          <p>Resetting offsets will cause this group to re-process or skip messages. Members must be paused or stopped first.</p>
        </div>
        <button className="iconbtn" onClick={onClose}><I.close size={14}/></button>
      </div>
      <div className="modal-b">
        <label className="lbl">Reset strategy</label>
        <div className="col" style={{ gap: 6 }}>
          {[
            ["earliest", "Earliest", "Re-consume all messages from the start of the topic"],
            ["latest", "Latest", "Skip to the end — drop all unconsumed messages"],
            ["timestamp", "By timestamp", "Reset to a specific point in time"],
            ["offset", "Specific offset", "Reset to a manually-entered offset"],
          ].map(([v, l, d]) => (
            <label key={v} className="row" style={{ gap: 10, padding: 10, border: `1px solid ${strategy === v ? "var(--accent)" : "var(--border)"}`, borderRadius: 6, cursor: "pointer", background: strategy === v ? "var(--accent-soft)" : "transparent", alignItems: "flex-start" }}>
              <input type="radio" checked={strategy === v} onChange={() => setStrategy(v)} style={{ marginTop: 2 }}/>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{l}</div>
                <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{d}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
      <div className="modal-f">
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn" data-variant="primary"><I.rotate size={12}/> Reset offsets</button>
      </div>
    </Modal>
  );
}

// ============ SCHEMAS ============
function SchemasPage() {
  const [q, setQ] = opS("");
  const [selected, setSelected] = opS(null);
  const filtered = KAFKA_DATA.SCHEMAS.filter(s => s.subject.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Schemas</h1>
          <div className="sub">{KAFKA_DATA.SCHEMAS.length} subjects in registry · <span className="mono" style={{ color: "var(--accent)" }}>schema-registry-1.use1</span></div>
        </div>
        <div className="row">
          <button className="btn"><I.upload size={13}/> Import</button>
          <button className="btn" data-variant="primary"><I.plus size={13}/> Register schema</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 1.4fr" : "1fr", gap: 14 }}>
        <div className="tbl-wrap">
          <div className="tbl-toolbar">
            <div className="input-group" style={{ width: 280 }}>
              <I.search size={13}/><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search subjects..."/>
            </div>
            <div className="grow"/>
            <span className="muted" style={{ fontSize: 12 }}>{filtered.length} subjects</span>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Type</th>
                <th>Compatibility</th>
                <th className="num">Versions</th>
                <th>Last changed</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.subject} data-active={selected?.subject === s.subject} onClick={() => setSelected(s)}>
                  <td className="mono" style={{ color: "var(--fg)" }}>{s.subject}</td>
                  <td><span className="badge" data-tone={s.type === "AVRO" ? "accent" : s.type === "PROTOBUF" ? "violet" : "amber"}>{s.type}</span></td>
                  <td><span className="mono" style={{ fontSize: 11.5, color: s.compatibility === "NONE" ? "var(--red)" : "var(--fg-2)" }}>{s.compatibility}</span></td>
                  <td className="num mono tabnum">{s.versions}</td>
                  <td className="muted" style={{ fontSize: 12 }}>{s.lastChanged}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selected && <SchemaDetail schema={selected} onClose={() => setSelected(null)}/>}
      </div>
    </div>
  );
}

function SchemaDetail({ schema, onClose }) {
  const [tab, setTab] = opS("schema");
  return (
    <div className="card" style={{ alignSelf: "flex-start" }}>
      <div className="card-h">
        <div style={{ minWidth: 0 }}>
          <h3 className="mono" style={{ fontSize: 13 }}>{schema.subject}</h3>
          <div className="sub row" style={{ gap: 10 }}>
            <span className="badge" data-tone="accent">v{schema.latestVersion} latest</span>
            <span><span className="muted">Type</span> <span className="mono">{schema.type}</span></span>
            <span><span className="muted">Compatibility</span> <span className="mono" style={{ color: schema.compatibility === "NONE" ? "var(--red)" : "inherit" }}>{schema.compatibility}</span></span>
          </div>
        </div>
        <button className="iconbtn" onClick={onClose}><I.close size={14}/></button>
      </div>
      <div className="tabs" style={{ marginBottom: 0, padding: "0 14px" }}>
        {[["schema", "Schema"], ["versions", "Versions", schema.versions], ["diff", "Diff"], ["compat", "Compatibility"]].map(([k, l, b]) => (
          <button key={k} className="tab" data-active={tab === k} onClick={() => setTab(k)}>{l}{b ? <span className="badge">{b}</span> : null}</button>
        ))}
      </div>
      {tab === "schema" && (
        <div>
          <div style={{ padding: "8px 14px", borderBottom: "1px solid var(--border)", display: "flex", gap: 6, alignItems: "center", fontSize: 12 }}>
            <span className="muted">Version</span>
            <select className="select" style={{ width: 80, height: 22 }}>
              {Array.from({length: schema.versions}).map((_, i) => <option key={i}>{schema.versions - i}</option>)}
            </select>
            <div style={{ flex: 1 }}/>
            <button className="iconbtn" data-size="sm" title="Copy"><I.copy size={12}/></button>
            <button className="iconbtn" data-size="sm" title="Download"><I.download size={12}/></button>
          </div>
          <div style={{ maxHeight: 480, overflow: "auto" }}>
            <JsonViewer data={KAFKA_DATA.SCHEMA_CONTENT_AVRO}/>
          </div>
        </div>
      )}
      {tab === "versions" && (
        <table className="tbl">
          <thead><tr><th className="num">v</th><th>Registered</th><th>By</th><th>Size</th><th></th></tr></thead>
          <tbody>
            {Array.from({length: schema.versions}).map((_, i) => (
              <tr key={i}>
                <td className="num mono tabnum">{schema.versions - i}</td>
                <td className="muted" style={{ fontSize: 12 }}>{i === 0 ? schema.lastChanged : `${i+1} weeks ago`}</td>
                <td className="mono">{["alex.k", "rusudan.v", "mike.l"][i % 3]}</td>
                <td className="mono muted">{1.2 + i * 0.1} KB</td>
                <td><button className="iconbtn" data-size="sm"><I.diff size={12}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {tab === "diff" && (
        <div style={{ padding: 14 }}>
          <div className="row" style={{ gap: 8, marginBottom: 12, fontSize: 12 }}>
            <span className="muted">Compare</span>
            <select className="select" style={{ width: 80, height: 24 }}><option>v3</option></select>
            <I.arrowRight size={12}/>
            <select className="select" style={{ width: 80, height: 24 }}><option>v4</option></select>
          </div>
          <div className="card mono" style={{ fontSize: 12, padding: 12, lineHeight: 1.7 }}>
            <div>{"  fields: ["}</div>
            <div>{"    { name: \"order_id\", type: \"string\" },"}</div>
            <div>{"    { name: \"user_id\",  type: \"string\" },"}</div>
            <div style={{ background: "color-mix(in oklab, var(--green) 18%, transparent)", padding: "0 6px", margin: "0 -12px", borderLeft: "2px solid var(--green)" }}>+   {"{ name: \"status\",   type: [\"null\",\"string\"], default: null },"}</div>
            <div style={{ background: "color-mix(in oklab, var(--red) 18%, transparent)", padding: "0 6px", margin: "0 -12px", borderLeft: "2px solid var(--red)", color: "var(--fg-3)" }}>-   {"{ name: \"legacy_status\", type: \"string\" },"}</div>
            <div>{"    { name: \"ts\",       type: { type: \"long\", logicalType: \"timestamp-millis\" } }"}</div>
            <div>{"  ]"}</div>
          </div>
          <div style={{ marginTop: 10, padding: 10, background: "var(--green-bg)", border: "1px solid color-mix(in oklab, var(--green) 35%, transparent)", borderRadius: 6, fontSize: 12 }}>
            <span className="row" style={{ gap: 6 }}><I.check_circle size={13} style={{ color: "var(--green)" }}/> <strong>BACKWARD compatible</strong> — old consumers can read v4 data.</span>
          </div>
        </div>
      )}
      {tab === "compat" && (
        <div style={{ padding: 14 }}>
          <label className="lbl">Compatibility mode</label>
          <select className="select" defaultValue={schema.compatibility}>
            {["NONE", "BACKWARD", "BACKWARD_TRANSITIVE", "FORWARD", "FORWARD_TRANSITIVE", "FULL", "FULL_TRANSITIVE"].map(c => <option key={c}>{c}</option>)}
          </select>
          <div className="help">Determines what schema changes are accepted by the registry.</div>
          <div style={{ marginTop: 14, padding: 12, background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }}>
            <strong>Test compatibility</strong>
            <div className="muted" style={{ marginBottom: 8, marginTop: 4 }}>Paste a schema below to check if it would be accepted as the next version.</div>
            <textarea className="input mono" style={{ minHeight: 120, fontSize: 11.5 }} placeholder={"{\n  \"type\": \"record\",\n  \"name\": \"OrderEvent\",\n  ...\n}"}/>
            <button className="btn" data-size="sm" style={{ marginTop: 8 }}><I.check size={12}/> Check compatibility</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ ACLs ============
function AclsPage() {
  const [q, setQ] = opS("");
  const [view, setView] = opS("resource"); // resource | principal
  const [createOpen, setCreateOpen] = opS(false);
  const filtered = KAFKA_DATA.ACLS.filter(a =>
    a.principal.toLowerCase().includes(q.toLowerCase()) ||
    a.resource.toLowerCase().includes(q.toLowerCase())
  );
  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Access control</h1>
          <div className="sub">{KAFKA_DATA.ACLS.length} ACLs · {new Set(KAFKA_DATA.ACLS.map(a => a.principal)).size} principals · authz: <span className="mono">SimpleAclAuthorizer</span></div>
        </div>
        <div className="row">
          <button className="btn"><I.download size={13}/> Export</button>
          <button className="btn" data-variant="primary" onClick={() => setCreateOpen(true)}><I.plus size={13}/> Create ACL</button>
        </div>
      </div>
      <div className="tbl-wrap">
        <div className="tbl-toolbar">
          <div className="input-group" style={{ width: 280 }}>
            <I.search size={13}/><input value={q} onChange={e => setQ(e.target.value)} placeholder="Filter principals or resources..."/>
          </div>
          <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: 6, padding: 1 }}>
            {[["resource", "By resource"], ["principal", "By principal"]].map(([v, l]) => (
              <button key={v} onClick={() => setView(v)}
                      style={{ padding: "3px 10px", fontSize: 11.5, background: view === v ? "var(--bg-active)" : "transparent",
                               color: view === v ? "var(--fg)" : "var(--fg-3)", border: 0, borderRadius: 4, cursor: "pointer", fontFamily: "inherit" }}>
                {l}
              </button>
            ))}
          </div>
          <div className="grow"/>
          <span className="muted" style={{ fontSize: 12 }}>{filtered.length} ACLs</span>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Principal</th>
              <th>Resource</th>
              <th>Pattern</th>
              <th>Operation</th>
              <th>Permission</th>
              <th>Host</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a, i) => (
              <tr key={i}>
                <td className="mono">{a.principal}</td>
                <td className="mono">{a.resource}</td>
                <td className="muted" style={{ fontSize: 11.5 }}>{a.pattern}</td>
                <td className="mono">{a.op}</td>
                <td>{a.perm === "Allow" ? <span className="badge" data-tone="green"><span className="ico"/>Allow</span> : <span className="badge" data-tone="red"><span className="ico"/>Deny</span>}</td>
                <td className="mono muted">{a.host}</td>
                <td><div className="row-actions"><button className="iconbtn" data-size="sm"><I.edit size={12}/></button><button className="iconbtn" data-size="sm"><I.trash size={12}/></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CreateAclModal open={createOpen} onClose={() => setCreateOpen(false)}/>
    </div>
  );
}

function CreateAclModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="modal-h">
        <div className="icon-pill" data-tone="accent"><I.shield size={16}/></div>
        <div style={{ flex: 1 }}>
          <h3>Create ACL</h3>
          <p>Grant or deny operations on Kafka resources to a specific principal.</p>
        </div>
        <button className="iconbtn" onClick={onClose}><I.close size={14}/></button>
      </div>
      <div className="modal-b">
        <div className="col" style={{ gap: 12 }}>
          <div className="grid-2">
            <div>
              <label className="lbl">Principal <span className="req">*</span></label>
              <input className="input mono" placeholder="User:my-service"/>
            </div>
            <div>
              <label className="lbl">Host</label>
              <input className="input mono" defaultValue="*"/>
            </div>
          </div>
          <div className="grid-2">
            <div>
              <label className="lbl">Resource type</label>
              <select className="select"><option>Topic</option><option>Group</option><option>Cluster</option><option>TransactionalId</option></select>
            </div>
            <div>
              <label className="lbl">Pattern</label>
              <select className="select"><option>Literal</option><option>Prefixed</option></select>
            </div>
          </div>
          <div>
            <label className="lbl">Resource name</label>
            <input className="input mono" placeholder="orders.events.v3"/>
          </div>
          <div>
            <label className="lbl">Operations</label>
            <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
              {["Read", "Write", "Create", "Delete", "Alter", "Describe", "ClusterAction", "All"].map(op => (
                <label key={op} className="row" style={{ gap: 6, padding: "4px 10px", border: "1px solid var(--border)", borderRadius: 999, cursor: "pointer", fontSize: 12 }}>
                  <input type="checkbox" className="chk"/> {op}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="lbl">Permission</label>
            <div className="row" style={{ gap: 8 }}>
              <label className="row" style={{ gap: 6, padding: "6px 12px", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer", flex: 1 }}>
                <input type="radio" name="perm" defaultChecked/> <span className="badge" data-tone="green"><span className="ico"/>Allow</span>
              </label>
              <label className="row" style={{ gap: 6, padding: "6px 12px", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer", flex: 1 }}>
                <input type="radio" name="perm"/> <span className="badge" data-tone="red"><span className="ico"/>Deny</span>
              </label>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-f">
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn" data-variant="primary"><I.shield size={12}/> Create ACL</button>
      </div>
    </Modal>
  );
}

// ============ BROKERS ============
function BrokersPage() {
  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Brokers</h1>
          <div className="sub">{KAFKA_DATA.BROKERS.length} brokers · 3 racks · controller <span className="mono">1001</span></div>
        </div>
        <div className="row">
          <button className="btn"><I.refresh size={13}/> Refresh</button>
          <button className="btn"><I.zap size={13}/> Trigger rebalance</button>
        </div>
      </div>
      <div className="kpi-row" style={{ marginBottom: 14 }}>
        <KpiTileSimple label="Online" val="6 / 6"/>
        <KpiTileSimple label="Total partitions" val="1,106"/>
        <KpiTileSimple label="Avg disk" val="64%"/>
        <KpiTileSimple label="Avg CPU" val="45%"/>
        <KpiTileSimple label="Inter-broker" val="752 MB/s"/>
        <KpiTileSimple label="Under-replicated" val="3" tone="amber"/>
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>ID</th>
              <th>Host</th>
              <th>Rack</th>
              <th>Role</th>
              <th className="num">Partitions</th>
              <th className="num">Leaders</th>
              <th className="num">Disk</th>
              <th className="num">CPU</th>
              <th className="num">Network</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {KAFKA_DATA.BROKERS.map(b => (
              <tr key={b.id}>
                <td className="mono tabnum">{b.id}</td>
                <td className="mono">{b.host}</td>
                <td className="mono muted">{b.rack}</td>
                <td>{b.role === "controller" ? <span className="badge" data-tone="accent">controller</span> : <span className="muted">broker</span>}</td>
                <td className="num mono tabnum">{b.partitions}</td>
                <td className="num mono tabnum">{b.leaders}</td>
                <td className="num"><DiskBar pct={b.disk}/></td>
                <td className="num mono tabnum" style={{ color: b.cpu > 70 ? "var(--amber)" : "inherit" }}>{b.cpu}%</td>
                <td className="num mono tabnum">{b.network} MB/s</td>
                <td><StatusBadge state={b.status}/></td>
                <td><button className="iconbtn" data-size="sm"><I.more size={12}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ SETTINGS ============
function SettingsPage() {
  return (
    <div className="page">
      <div className="page-h">
        <div><h1>Settings</h1><div className="sub">Connection and preferences for this cluster</div></div>
      </div>
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-h"><h3>Connection</h3></div>
        <div style={{ padding: 14, display: "grid", gridTemplateColumns: "auto 1fr", gap: "10px 16px", fontSize: 12.5 }}>
          <span className="muted">Bootstrap servers</span><span className="mono">b-1.use1.prod.kafka:9094, b-2.use1.prod.kafka:9094, b-3.use1.prod.kafka:9094</span>
          <span className="muted">Security protocol</span><span className="mono">SASL_SSL</span>
          <span className="muted">SASL mechanism</span><span className="mono">SCRAM-SHA-512</span>
          <span className="muted">Client ID</span><span className="mono">kafka-gui-rusudan.v</span>
          <span className="muted">Schema registry</span><span className="mono">https://schema-registry-1.use1.kafka:8081</span>
        </div>
      </div>
      <div className="card">
        <div className="card-h"><h3>Preferences</h3></div>
        <div style={{ padding: 14 }}>
          <div className="muted" style={{ fontSize: 12 }}>Use the Tweaks panel (bottom-right) to change theme, density, accent color, and live-tail behavior.</div>
        </div>
      </div>
    </div>
  );
}

// ============ PRODUCE MESSAGE MODAL ============
function ProduceModal({ open, onClose, defaultTopic, toast }) {
  const [topic, setTopic] = opS(defaultTopic || "orders.events.v3");
  const [partition, setPartition] = opS("auto");
  const [key, setKey] = opS("usr_4f2k3jh1");
  const [valueType, setValueType] = opS("json");
  const [value, setValue] = opS(JSON.stringify({
    order_id: "ord_19fk2l3p",
    user_id: "usr_4f2k3jh1",
    items: 3,
    total_cents: 4299,
    currency: "USD",
    status: "pending",
    ts: Date.now()
  }, null, 2));
  const [headers, setHeaders] = opS([{ k: "x-trace-id", v: "abc123def456" }, { k: "content-type", v: "application/json" }]);
  opE(() => { if (open && defaultTopic) setTopic(defaultTopic); }, [open, defaultTopic]);

  const send = () => {
    onClose();
    toast?.({ tone: "success", msg: <>Message produced to <span className="mono">{topic}</span> · partition {partition === "auto" ? "12" : partition} · offset {fmt.numFull(4823184201)}</> });
  };

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="modal-h">
        <div className="icon-pill" data-tone="accent"><I.send size={16}/></div>
        <div style={{ flex: 1 }}>
          <h3>Produce message</h3>
          <p>Send a single message. Producing here uses your client credentials and respects ACLs.</p>
        </div>
        <button className="iconbtn" onClick={onClose}><I.close size={14}/></button>
      </div>
      <div className="modal-b">
        <div className="col" style={{ gap: 12 }}>
          <div className="grid-2">
            <div>
              <label className="lbl">Topic <span className="req">*</span></label>
              <select className="select mono" value={topic} onChange={e => setTopic(e.target.value)}>
                {KAFKA_DATA.TOPICS.filter(t => !t.system).map(t => <option key={t.name}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="lbl">Partition</label>
              <select className="select mono" value={partition} onChange={e => setPartition(e.target.value)}>
                <option value="auto">Auto (key-hashed)</option>
                {Array.from({length: 24}).map((_, i) => <option key={i} value={i}>Partition {i}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="lbl">Key</label>
            <input className="input mono" value={key} onChange={e => setKey(e.target.value)} placeholder="leave blank for null"/>
            <div className="help">Determines partition assignment when set to auto.</div>
          </div>
          <div>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
              <label className="lbl" style={{ marginBottom: 0 }}>Value</label>
              <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: 6, padding: 1 }}>
                {[["json", "JSON"], ["avro", "Avro"], ["text", "Text"]].map(([v, l]) => (
                  <button key={v} onClick={() => setValueType(v)}
                          style={{ padding: "2px 10px", fontSize: 11, background: valueType === v ? "var(--bg-active)" : "transparent",
                                   color: valueType === v ? "var(--fg)" : "var(--fg-3)", border: 0, borderRadius: 4, cursor: "pointer", fontFamily: "inherit" }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <textarea className="input mono" value={value} onChange={e => setValue(e.target.value)} style={{ minHeight: 180, fontSize: 12 }}/>
            {valueType === "avro" && <div className="help">Schema: <span className="mono" style={{ color: "var(--accent)" }}>{topic}-value v4</span> — fields validated against registry on send.</div>}
          </div>
          <div>
            <label className="lbl">Headers</label>
            <div className="col" style={{ gap: 4 }}>
              {headers.map((h, i) => (
                <div key={i} className="row" style={{ gap: 6 }}>
                  <input className="input mono" placeholder="key" value={h.k} onChange={e => { const nh = [...headers]; nh[i].k = e.target.value; setHeaders(nh); }} style={{ flex: 1 }}/>
                  <input className="input mono" placeholder="value" value={h.v} onChange={e => { const nh = [...headers]; nh[i].v = e.target.value; setHeaders(nh); }} style={{ flex: 2 }}/>
                  <button className="iconbtn" onClick={() => setHeaders(headers.filter((_, j) => j !== i))}><I.trash size={12}/></button>
                </div>
              ))}
              <button className="btn" data-variant="ghost" data-size="sm" style={{ alignSelf: "flex-start" }} onClick={() => setHeaders([...headers, { k: "", v: "" }])}><I.plus size={12}/> Add header</button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-f">
        <button className="btn" data-variant="ghost" style={{ marginRight: "auto" }}><I.copy size={12}/> Copy as kcat</button>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn" data-variant="primary" onClick={send}><I.send size={12}/> Produce</button>
      </div>
    </Modal>
  );
}

window.ConsumersPage = ConsumersPage;
window.SchemasPage = SchemasPage;
window.AclsPage = AclsPage;
window.BrokersPage = BrokersPage;
window.SettingsPage = SettingsPage;
window.ProduceModal = ProduceModal;
