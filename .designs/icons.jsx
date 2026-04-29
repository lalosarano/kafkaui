// icons.jsx — minimal stroked icon set, sized by font-size (currentColor)

const Icon = ({ d, size = 14, fill = "none", stroke = "currentColor", sw = 1.6, children, ...rest }) => (
  <svg
    width={size} height={size} viewBox="0 0 16 16"
    fill={fill} stroke={stroke}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" {...rest}
  >
    {d ? <path d={d} /> : children}
  </svg>
);

const I = {
  // nav
  dashboard: (p) => <Icon {...p}><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></Icon>,
  topic: (p) => <Icon {...p}><path d="M2 4h12M2 8h12M2 12h8"/></Icon>,
  consumers: (p) => <Icon {...p}><circle cx="5" cy="6" r="2"/><circle cx="11" cy="6" r="2"/><path d="M2 13.5c0-1.7 1.3-3 3-3s3 1.3 3 3M8 13.5c0-1.7 1.3-3 3-3s3 1.3 3 3"/></Icon>,
  schemas: (p) => <Icon {...p}><path d="M3 3h6l4 4v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M9 3v4h4"/></Icon>,
  acls: (p) => <Icon {...p}><path d="M8 1.5l5 2v4c0 3-2.2 5.6-5 6.5-2.8-.9-5-3.5-5-6.5v-4l5-2z"/></Icon>,
  brokers: (p) => <Icon {...p}><rect x="2" y="3" width="12" height="4" rx="1"/><rect x="2" y="9" width="12" height="4" rx="1"/><circle cx="4.5" cy="5" r="0.5" fill="currentColor"/><circle cx="4.5" cy="11" r="0.5" fill="currentColor"/></Icon>,
  settings: (p) => <Icon {...p}><circle cx="8" cy="8" r="2"/><path d="M8 1v2M8 13v2M3.5 3.5l1.4 1.4M11.1 11.1l1.4 1.4M1 8h2M13 8h2M3.5 12.5l1.4-1.4M11.1 4.9l1.4-1.4"/></Icon>,
  alerts: (p) => <Icon {...p}><path d="M8 2c-2.5 0-4 1.5-4 4v3l-1 2h10l-1-2V6c0-2.5-1.5-4-4-4z"/><path d="M6.5 13a1.5 1.5 0 0 0 3 0"/></Icon>,
  // ui
  search: (p) => <Icon {...p}><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></Icon>,
  filter: (p) => <Icon {...p}><path d="M2 3h12l-4.5 6V14L6.5 12V9L2 3z"/></Icon>,
  plus: (p) => <Icon {...p}><path d="M8 3v10M3 8h10"/></Icon>,
  more: (p) => <Icon {...p}><circle cx="3.5" cy="8" r="0.7" fill="currentColor"/><circle cx="8" cy="8" r="0.7" fill="currentColor"/><circle cx="12.5" cy="8" r="0.7" fill="currentColor"/></Icon>,
  chevDown: (p) => <Icon {...p}><path d="M3.5 6L8 10.5 12.5 6"/></Icon>,
  chevRight: (p) => <Icon {...p}><path d="M6 3.5L10.5 8 6 12.5"/></Icon>,
  chevLeft: (p) => <Icon {...p}><path d="M10 3.5L5.5 8 10 12.5"/></Icon>,
  chevUpDown: (p) => <Icon {...p}><path d="M5 6.5L8 3.5 11 6.5M5 9.5L8 12.5 11 9.5"/></Icon>,
  arrowUp: (p) => <Icon {...p}><path d="M8 13V3M4 7l4-4 4 4"/></Icon>,
  arrowDown: (p) => <Icon {...p}><path d="M8 3v10M4 9l4 4 4-4"/></Icon>,
  close: (p) => <Icon {...p}><path d="M3.5 3.5l9 9M12.5 3.5l-9 9"/></Icon>,
  check: (p) => <Icon {...p}><path d="M3 8.5L6.5 12 13 4"/></Icon>,
  copy: (p) => <Icon {...p}><rect x="5" y="5" width="9" height="9" rx="1"/><path d="M3 11V3a1 1 0 0 1 1-1h7"/></Icon>,
  external: (p) => <Icon {...p}><path d="M9 3h4v4M13 3L7 9M11 9v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h3"/></Icon>,
  refresh: (p) => <Icon {...p}><path d="M3 8a5 5 0 0 1 9-3M13 8a5 5 0 0 1-9 3"/><path d="M11.5 2v3h-3M4.5 14v-3h3"/></Icon>,
  pause: (p) => <Icon {...p}><rect x="4" y="3" width="2.5" height="10"/><rect x="9.5" y="3" width="2.5" height="10"/></Icon>,
  play: (p) => <Icon {...p} fill="currentColor" stroke="none"><path d="M4 3l9 5-9 5V3z"/></Icon>,
  download: (p) => <Icon {...p}><path d="M8 2v8M4.5 6.5L8 10l3.5-3.5M3 13h10"/></Icon>,
  trash: (p) => <Icon {...p}><path d="M3 4h10M6 4V2.5h4V4M5 4l.7 9a1 1 0 0 0 1 1h2.6a1 1 0 0 0 1-1L11 4"/></Icon>,
  edit: (p) => <Icon {...p}><path d="M11 2.5l2.5 2.5L6 12.5 3 13l.5-3L11 2.5z"/></Icon>,
  eye: (p) => <Icon {...p}><path d="M1.5 8s2.5-5 6.5-5 6.5 5 6.5 5-2.5 5-6.5 5S1.5 8 1.5 8z"/><circle cx="8" cy="8" r="2"/></Icon>,
  hide: (p) => <Icon {...p}><path d="M2 2l12 12M6.5 4.7C7 4.6 7.5 4.5 8 4.5c4 0 6.5 5 6.5 5-.5 1-1.2 1.9-2 2.6M11 11.4c-.9.5-1.9.8-3 .8-4 0-6.5-5-6.5-5 .6-1.2 1.5-2.3 2.5-3.1"/></Icon>,
  star: (p) => <Icon {...p}><path d="M8 2l1.8 3.7 4.2.6-3 3 .7 4.2-3.7-2-3.7 2 .7-4.2-3-3 4.2-.6L8 2z"/></Icon>,
  pin: (p) => <Icon {...p}><path d="M6 2h4l-.5 4 2 2-1 1H5l-1-1 2-2L5.5 2"/><path d="M8 9v5"/></Icon>,
  bell: (p) => <Icon {...p}><path d="M8 2c-2.5 0-4 1.5-4 4v3l-1 2h10l-1-2V6c0-2.5-1.5-4-4-4z"/><path d="M6.5 13a1.5 1.5 0 0 0 3 0"/></Icon>,
  database: (p) => <Icon {...p}><ellipse cx="8" cy="3.5" rx="5" ry="1.5"/><path d="M3 3.5v5c0 .8 2.2 1.5 5 1.5s5-.7 5-1.5v-5"/><path d="M3 8.5v4c0 .8 2.2 1.5 5 1.5s5-.7 5-1.5v-4"/></Icon>,
  message: (p) => <Icon {...p}><path d="M2 3h12v8H6l-3 2.5V11H2V3z"/></Icon>,
  send: (p) => <Icon {...p}><path d="M14 2L2 7l4.5 1.5L14 2zM14 2L8 14l-1.5-5.5L14 2z"/></Icon>,
  panel: (p) => <Icon {...p}><rect x="2" y="3" width="12" height="10" rx="1"/><path d="M9.5 3v10"/></Icon>,
  cluster: (p) => <Icon {...p}><circle cx="8" cy="3" r="1.5"/><circle cx="3" cy="11" r="1.5"/><circle cx="13" cy="11" r="1.5"/><path d="M8 4.5l-4.5 5.5M8 4.5l4.5 5.5M3 11h10"/></Icon>,
  zap: (p) => <Icon {...p} fill="currentColor" stroke="none"><path d="M9 1L3 9h4l-1 6 6-8H8l1-6z"/></Icon>,
  shield: (p) => <Icon {...p}><path d="M8 1.5l5 2v4c0 3-2.2 5.6-5 6.5-2.8-.9-5-3.5-5-6.5v-4l5-2z"/></Icon>,
  user: (p) => <Icon {...p}><circle cx="8" cy="5.5" r="2.5"/><path d="M3 13.5c0-2.2 2.2-4 5-4s5 1.8 5 4"/></Icon>,
  link: (p) => <Icon {...p}><path d="M7 9.5L9.5 7M6 11l-1 1a2.5 2.5 0 0 1-3.5-3.5L3 7M10 5l1-1a2.5 2.5 0 0 1 3.5 3.5L13 9"/></Icon>,
  history: (p) => <Icon {...p}><path d="M3 8a5 5 0 1 0 1.5-3.5L3 6"/><path d="M3 3v3h3M8 5v3.5L10.5 10"/></Icon>,
  diff: (p) => <Icon {...p}><path d="M5 2v9M5 11l-2-2M5 11l2-2"/><path d="M11 14V5M11 5l-2 2M11 5l2 2"/></Icon>,
  power: (p) => <Icon {...p}><path d="M8 1.5v6"/><path d="M11.5 3.5a4.5 4.5 0 1 1-7 0"/></Icon>,
  command: (p) => <Icon {...p}><path d="M5.5 2.5h-1A1.5 1.5 0 1 0 4.5 5.5H5.5V2.5zM10.5 13.5h1a1.5 1.5 0 1 0 0-3H10.5V13.5zM10.5 5.5h1a1.5 1.5 0 1 0 0-3H10.5V5.5zM5.5 13.5h-1A1.5 1.5 0 1 1 4.5 10.5H5.5V13.5zM5.5 5.5h5v5h-5z"/></Icon>,
  upload: (p) => <Icon {...p}><path d="M8 11V3M4.5 6.5L8 3l3.5 3.5M3 13h10"/></Icon>,
  rotate: (p) => <Icon {...p}><path d="M2 8a6 6 0 0 1 10.5-4M14 4v3h-3"/></Icon>,
  collapse: (p) => <Icon {...p}><path d="M6 3v10M3 6L1 8l2 2M9 6l2 2-2 2"/></Icon>,
  expand: (p) => <Icon {...p}><path d="M6 3v10M3 5l-2 3 2 3M9 5l2 3-2 3"/></Icon>,
  arrowRight: (p) => <Icon {...p}><path d="M3 8h10M9 4l4 4-4 4"/></Icon>,
  warning: (p) => <Icon {...p}><path d="M8 2L1.5 13.5h13L8 2z"/><path d="M8 6.5v3M8 11.5v.5"/></Icon>,
  info: (p) => <Icon {...p}><circle cx="8" cy="8" r="6"/><path d="M8 7v4M8 5v.5"/></Icon>,
  check_circle: (p) => <Icon {...p}><circle cx="8" cy="8" r="6"/><path d="M5.5 8L7.5 10 11 6.5"/></Icon>,
  x_circle: (p) => <Icon {...p}><circle cx="8" cy="8" r="6"/><path d="M5.5 5.5l5 5M10.5 5.5l-5 5"/></Icon>,
  hash: (p) => <Icon {...p}><path d="M6 2.5l-1 11M11 2.5l-1 11M2.5 6h11M2.5 10h11"/></Icon>,
  lag: (p) => <Icon {...p}><path d="M2 13c0-3 2-5 6-5s6 2 6 5"/><path d="M5 8V4M11 8V4"/></Icon>,
};

window.I = I;
window.Icon = Icon;
