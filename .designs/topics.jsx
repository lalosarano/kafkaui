// topics.jsx — topics list + detail (drawer or full page)

const { useState: uS, useEffect: uE, useMemo: uM, useRef: uR } = React;

function TopicsListPage({ setRoute, openProduce, tweaks }) {
  const [q, setQ] = uS("");
  const [showSystem, setShowSystem] = uS(false);
  const [selected, setSelected] = uS(new Set());
  const [createOpen, setCreateOpen] = uS(false);

  const filtered = uM(() => {
    return KAFKA_DATA.TOPICS.filter(t => (showSystem || !t.system) && t.name.toLowerCase().includes(q.toLowerCase()));
  }, [q, showSystem]);

  const [sorted, sort, onSort] = useSort(filtered, "name");

  const allSel = sorted.length > 0 && sorted.every(t => selected.has(t.name));
  const someSel = sorted.some(t => selected.has(t.name)) && !allSel;
  const toggleAll = () => {
    if (allSel) setSelected(new Set());
    else setSelected(new Set(sorted.map(t => t.name)));
  };

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Topics</h1>
          <div className="sub">{KAFKA_DATA.TOPICS.filter(t => !t.system).length} topics · 2 internal</div>
        </div>
        <div className="row">
          <button className="btn"><I.download size={13}/> Export</button>
          <button className="btn" data-variant="primary" onClick={() => setCreateOpen(true)}><I.plus size={13}/> Create topic</button>
        </div>
      </div>

      <div className="tbl-wrap">
        <div className="tbl-toolbar">
          <div className="input-group" style={{ width: 280 }}>
            <I.search size={13}/>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Filter topics by name..."/>
            <span className="kbd">/</span>
          </div>
          <button className="btn" data-variant="ghost" data-size="sm"><I.filter size={12}/> Filter</button>
          <div style={{ height: 18, width: 1, background: "var(--border)", margin: "0 4px" }}/>
          <label className="row" style={{ gap: 6, fontSize: 12, color: "var(--fg-3)", cursor: "pointer" }}>
            <input type="checkbox" className="chk" checked={showSystem} onChange={e => setShowSystem(e.target.checked)}/>
            Show system topics
          </label>
          <div className="grow"/>
          {selected.size > 0 ? (
            <>
              <span className="muted" style={{ fontSize: 12 }}>{selected.size} selected</span>
              <button className="btn" data-size="sm"><I.edit size={12}/> Edit configs</button>
              <button className="btn" data-size="sm"><I.download size={12}/> Export</button>
              <button className="btn" data-size="sm" data-variant="danger"><I.trash size={12}/> Delete</button>
            </>
          ) : (
            <>
              <button className="btn" data-variant="ghost" data-size="sm"><I.panel size={12}/> Columns</button>
              <span className="muted" style={{ fontSize: 12 }}>{sorted.length} topics</span>
            </>
          )}
        </div>
        <div className="tbl-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 32 }}>
                  <input type="checkbox" className="chk" checked={allSel} data-indeterminate={someSel} onChange={toggleAll}/>
                </th>
                <SortHead k="name" sort={sort} onSort={onSort}>Name</SortHead>
                <SortHead k="partitions" sort={sort} onSort={onSort} num>Partitions</SortHead>
                <SortHead k="rf" sort={sort} onSort={onSort} num>RF</SortHead>
                <SortHead k="msgs" sort={sort} onSort={onSort} num>Messages</SortHead>
                <SortHead k="size" sort={sort} onSort={onSort} num>Size</SortHead>
                <SortHead k="throughput" sort={sort} onSort={onSort} num>Throughput</SortHead>
                <SortHead k="lag" sort={sort} onSort={onSort} num>Lag</SortHead>
                <SortHead k="retentionMs" sort={sort} onSort={onSort} num>Retention</SortHead>
                <th>Owner</th>
                <th style={{ width: 100 }}></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(t => (
                <tr key={t.name} data-selected={selected.has(t.name)} onClick={() => setRoute({ page: "topics", topic: t.name })}>
                  <td onClick={e => e.stopPropagation()}>
                    <input type="checkbox" className="chk" checked={selected.has(t.name)} onChange={e => {
                      const n = new Set(selected);
                      if (e.target.checked) n.add(t.name); else n.delete(t.name);
                      setSelected(n);
                    }}/>
                  </td>
                  <td>
                    <div className="row" style={{ gap: 8 }}>
                      <span className="mono" style={{ color: t.system ? "var(--fg-3)" : "var(--fg)" }}>{t.name}</span>
                      {t.system && <span className="badge" data-tone="violet">internal</span>}
                      {t.config.cleanup === "compact" && <span className="badge">compact</span>}
                    </div>
                  </td>
                  <td className="num mono tabnum">{t.partitions}</td>
                  <td className="num mono tabnum">{t.rf}</td>
                  <td className="num mono tabnum">{fmt.num(t.msgs)}</td>
                  <td className="num mono tabnum">{fmt.bytes(t.size)}</td>
                  <td className="num mono tabnum" style={{ color: t.throughput > 50000 ? "var(--accent)" : "inherit" }}>{fmt.rate(t.throughput)}</td>
                  <td className="num"><LagIndicator lag={t.lag}/></td>
                  <td className="num mono tabnum muted">{fmt.ms(t.retentionMs)}</td>
                  <td className="muted" style={{ fontSize: 12 }}>{t.owner}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <div className="row-actions">
                      <button className="iconbtn" data-size="sm" title="View messages"><I.eye size={12}/></button>
                      <button className="iconbtn" data-size="sm" title="Produce" onClick={() => openProduce(t.name)}><I.send size={12}/></button>
                      <button className="iconbtn" data-size="sm" title="More"><I.more size={12}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="tbl-foot">
          <span>{sorted.length} of {KAFKA_DATA.TOPICS.length} topics</span>
          <div className="pager">
            <button className="iconbtn" data-size="sm" disabled><I.chevLeft size={12}/></button>
            <span className="mono" style={{ fontSize: 12 }}>1 / 1</span>
            <button className="iconbtn" data-size="sm" disabled><I.chevRight size={12}/></button>
          </div>
        </div>
      </div>

      <CreateTopicModal open={createOpen} onClose={() => setCreateOpen(false)}/>
    </div>
  );
}

function SortHead({ k, sort, onSort, num, children }) {
  const dir = sort.key === k ? sort.dir : null;
  return (
    <th data-sortable="true" data-sort={dir} className={num ? "num" : ""} onClick={() => onSort(k)}>
      <span style={{ display: "inline-flex", alignItems: "center" }}>
        {children}
        <span className="sortico">
          {dir === "asc" && <I.arrowUp size={11}/>}
          {dir === "desc" && <I.arrowDown size={11}/>}
          {!dir && <I.chevUpDown size={11}/>}
        </span>
      </span>
    </th>
  );
}

function CreateTopicModal({ open, onClose }) {
  const [name, setName] = uS("");
  const [parts, setParts] = uS(6);
  const [rf, setRf] = uS(3);
  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="modal-h">
        <div className="icon-pill" data-tone="accent"><I.plus size={16}/></div>
        <div style={{ flex: 1 }}>
          <h3>Create topic</h3>
          <p>Topics are append-only, partitioned logs. Configure replication and retention up front — these are hard to change later.</p>
        </div>
        <button className="iconbtn" onClick={onClose}><I.close size={14}/></button>
      </div>
      <div className="modal-b">
        <div className="col" style={{ gap: 14 }}>
          <div>
            <label className="lbl">Topic name <span className="req">*</span></label>
            <input className="input" placeholder="orders.events.v1" value={name} onChange={e => setName(e.target.value)} style={{ fontFamily: "var(--font-mono)" }}/>
            <div className="help">Lowercase, dot-separated. <span className="mono">domain.entity.version</span> is the convention.</div>
          </div>
          <div className="grid-2">
            <div>
              <label className="lbl">Partitions</label>
              <input className="input mono" type="number" value={parts} onChange={e => setParts(+e.target.value)}/>
              <div className="help">Sets max parallelism. Hard to increase safely later.</div>
            </div>
            <div>
              <label className="lbl">Replication factor</label>
              <input className="input mono" type="number" value={rf} onChange={e => setRf(+e.target.value)}/>
              <div className="help">3 recommended for prod.</div>
            </div>
          </div>
          <div className="grid-2">
            <div>
              <label className="lbl">Cleanup policy</label>
              <select className="select"><option>delete</option><option>compact</option><option>compact,delete</option></select>
            </div>
            <div>
              <label className="lbl">Retention</label>
              <div className="row" style={{ gap: 0 }}>
                <input className="input mono" defaultValue={7} style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRight: 0 }}/>
                <select className="select" style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, width: 100 }}><option>days</option><option>hours</option><option>ms</option></select>
              </div>
            </div>
          </div>
          <div>
            <label className="lbl">Compression</label>
            <select className="select"><option>producer (default)</option><option>zstd</option><option>snappy</option><option>lz4</option><option>gzip</option></select>
          </div>
          <div style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 6, padding: 10, fontSize: 12, color: "var(--fg-3)" }}>
            <div className="row" style={{ gap: 6, color: "var(--fg-2)", marginBottom: 4 }}><I.info size={12}/> Estimated storage</div>
            ~<span className="mono" style={{ color: "var(--fg)" }}>{(parts * rf * 0.5).toFixed(1)} GB</span> at peak retention with 1KB messages at 1k msg/s
          </div>
        </div>
      </div>
      <div className="modal-f">
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn" data-variant="primary" disabled={!name}><I.plus size={12}/> Create topic</button>
      </div>
    </Modal>
  );
}

window.TopicsListPage = TopicsListPage;
window.SortHead = SortHead;
