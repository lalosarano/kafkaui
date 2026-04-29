// shell.jsx — sidebar, topbar, command palette

const NAV = [
  { id: "dashboard", label: "Overview", icon: "dashboard" },
  { id: "topics", label: "Topics", icon: "topic", badge: "18" },
  { id: "consumers", label: "Consumer groups", icon: "consumers", badge: "1", badgeTone: "amber" },
  { id: "schemas", label: "Schemas", icon: "schemas" },
  { id: "acls", label: "ACLs", icon: "acls" },
  { id: "brokers", label: "Brokers", icon: "brokers" },
];
const NAV_BOTTOM = [
  { id: "settings", label: "Settings", icon: "settings" },
];

function Sidebar({ route, setRoute, collapsed, setCollapsed }) {
  return (
    <aside className="sidebar">
      <div className="sb-cluster" title="Switch cluster">
        <span className="dot"/>
        {!collapsed && (
          <>
            <div className="info">
              <div className="name">prod-use1</div>
              <div className="env">Production · 6 brokers</div>
            </div>
            <span className="chev"><I.chevUpDown size={14}/></span>
          </>
        )}
      </div>

      <nav className="sb-nav">
        {!collapsed && <div className="sb-section">Cluster</div>}
        {NAV.map(n => {
          const Ico = I[n.icon];
          return (
            <a key={n.id} className="sb-item" data-active={route.page === n.id}
               onClick={() => setRoute({ page: n.id })}>
              <span className="icon"><Ico size={15}/></span>
              <span className="label">{n.label}</span>
              {n.badge && <span className="badge" data-tone={n.badgeTone}>{n.badge}</span>}
            </a>
          );
        })}
        <div style={{ flex: 1 }}/>
        {NAV_BOTTOM.map(n => {
          const Ico = I[n.icon];
          return (
            <a key={n.id} className="sb-item" data-active={route.page === n.id}
               onClick={() => setRoute({ page: n.id })}>
              <span className="icon"><Ico size={15}/></span>
              <span className="label">{n.label}</span>
            </a>
          );
        })}
      </nav>

      <div className="sb-foot">
        <div className="sb-user">
          <div className="sb-avatar">RV</div>
          {!collapsed && (
            <div className="who">
              Rusudan V.<br/>
              <span className="org">platform-eng</span>
            </div>
          )}
        </div>
        <button className="sb-ico-btn" title={collapsed ? "Expand" : "Collapse"}
                onClick={() => setCollapsed(c => !c)}>
          {collapsed ? <I.expand size={14}/> : <I.collapse size={14}/>}
        </button>
      </div>
    </aside>
  );
}
window.Sidebar = Sidebar;

function Topbar({ route, setRoute, openCmdK }) {
  const crumbs = [{ label: "prod-use1", page: "dashboard" }];
  if (route.page === "dashboard") crumbs.push({ label: "Overview", current: true });
  if (route.page === "topics" && !route.topic) crumbs.push({ label: "Topics", current: true });
  if (route.page === "topics" && route.topic) {
    crumbs.push({ label: "Topics", page: "topics" });
    crumbs.push({ label: route.topic, current: true, mono: true });
  }
  if (route.page === "consumers") crumbs.push({ label: "Consumer groups", current: true });
  if (route.page === "schemas") crumbs.push({ label: "Schemas", current: true });
  if (route.page === "acls") crumbs.push({ label: "ACLs", current: true });
  if (route.page === "brokers") crumbs.push({ label: "Brokers", current: true });
  if (route.page === "settings") crumbs.push({ label: "Settings", current: true });

  return (
    <div className="topbar">
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="sep">/</span>}
            <span className="crumb" data-current={c.current}
                  style={c.mono ? { fontFamily: "var(--font-mono)", fontSize: 12 } : null}
                  onClick={() => c.page && !c.current && setRoute({ page: c.page })}>
              {c.label}
            </span>
          </React.Fragment>
        ))}
      </div>
      <div className="tb-spacer"/>
      <button className="search-trigger" onClick={openCmdK}>
        <I.search size={13}/>
        <span>Search topics, groups, brokers…</span>
        <span className="kbd">⌘K</span>
      </button>
      <div className="tb-status">
        <span className="dot"/>
        <span>Connected · 14ms</span>
      </div>
      <button className="tb-btn" title="Alerts"><I.bell size={15}/></button>
      <button className="tb-btn" title="Help"><I.info size={15}/></button>
    </div>
  );
}
window.Topbar = Topbar;

// --- Command palette ---
function CommandPalette({ open, onClose, setRoute, openProduce }) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  useEffect(() => {
    if (open) {
      setQ(""); setActive(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const items = useMemo(() => {
    const all = [
      { group: "Navigation", icon: "dashboard", label: "Go to Overview", hint: "G then O", do: () => setRoute({ page: "dashboard" }) },
      { group: "Navigation", icon: "topic", label: "Go to Topics", hint: "G then T", do: () => setRoute({ page: "topics" }) },
      { group: "Navigation", icon: "consumers", label: "Go to Consumer groups", do: () => setRoute({ page: "consumers" }) },
      { group: "Navigation", icon: "schemas", label: "Go to Schemas", do: () => setRoute({ page: "schemas" }) },
      { group: "Navigation", icon: "acls", label: "Go to ACLs", do: () => setRoute({ page: "acls" }) },
      { group: "Navigation", icon: "brokers", label: "Go to Brokers", do: () => setRoute({ page: "brokers" }) },
      { group: "Actions", icon: "plus", label: "Create topic", hint: "C then T", do: () => setRoute({ page: "topics", create: true }) },
      { group: "Actions", icon: "send", label: "Produce a message", hint: "C then P", do: () => openProduce() },
      { group: "Actions", icon: "refresh", label: "Refresh metadata", do: () => {} },
      ...KAFKA_DATA.TOPICS.slice(0, 12).map(t => ({
        group: "Topics", icon: "topic", label: t.name, mono: true,
        hint: `${t.partitions} partitions · ${fmt.bytes(t.size)}`,
        do: () => setRoute({ page: "topics", topic: t.name })
      })),
      ...KAFKA_DATA.CONSUMER_GROUPS.slice(0, 8).map(g => ({
        group: "Consumer groups", icon: "consumers", label: g.id, mono: true,
        hint: `${g.state} · ${g.members} members`,
        do: () => setRoute({ page: "consumers", group: g.id })
      })),
    ];
    if (!q) return all;
    const s = q.toLowerCase();
    return all.filter(i => i.label.toLowerCase().includes(s) || (i.hint && i.hint.toLowerCase().includes(s)));
  }, [q]);

  // group items
  const grouped = useMemo(() => {
    const byGroup = {};
    items.forEach(i => { (byGroup[i.group] = byGroup[i.group] || []).push(i); });
    return Object.entries(byGroup);
  }, [items]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(items.length - 1, a + 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setActive(a => Math.max(0, a - 1)); }
      if (e.key === "Enter") {
        e.preventDefault();
        const item = items[active];
        if (item) { item.do(); onClose(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, items, active, onClose]);

  let idx = -1;
  return (
    <div className="cmdk-overlay" data-open={open} onClick={onClose}>
      <div className="cmdk" onClick={e => e.stopPropagation()}>
        <div className="cmdk-input">
          <I.search size={16}/>
          <input ref={inputRef} value={q} onChange={e => { setQ(e.target.value); setActive(0); }}
                 placeholder="Type a command, search topics, groups…"/>
          <kbd>esc</kbd>
        </div>
        <div className="cmdk-list">
          {grouped.length === 0 && (
            <div style={{ padding: 28, textAlign: "center", color: "var(--fg-3)", fontSize: 13 }}>
              No results for "{q}"
            </div>
          )}
          {grouped.map(([group, gItems]) => (
            <div className="cmdk-group" key={group}>
              <div className="cmdk-group-h">{group}</div>
              {gItems.map((it) => {
                idx++;
                const myIdx = idx;
                const Ico = I[it.icon];
                return (
                  <div key={it.label} className="cmdk-item" data-active={myIdx === active}
                       onMouseEnter={() => setActive(myIdx)}
                       onClick={() => { it.do(); onClose(); }}>
                    <span className="ico"><Ico size={14}/></span>
                    <span className="lbl" style={it.mono ? { fontFamily: "var(--font-mono)", fontSize: 12 } : null}>{it.label}</span>
                    <span className="hint">{it.hint}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="cmdk-foot">
          <span className="ft-item"><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span className="ft-item"><kbd>↵</kbd> select</span>
          <span className="ft-item"><kbd>esc</kbd> close</span>
          <span style={{ flex: 1 }}/>
          <span className="ft-item">Press <kbd>?</kbd> for shortcuts</span>
        </div>
      </div>
    </div>
  );
}
window.CommandPalette = CommandPalette;
