// Number / time / size formatting helpers shared across the UI.

export const fmt = {
  num(n: number | null | undefined): string {
    if (n == null) return "—";
    const a = Math.abs(n);
    if (a >= 1e12) return (n / 1e12).toFixed(2) + "T";
    if (a >= 1e9) return (n / 1e9).toFixed(2) + "B";
    if (a >= 1e6) return (n / 1e6).toFixed(2) + "M";
    if (a >= 1e3) return (n / 1e3).toFixed(1) + "K";
    return String(n);
  },
  numFull(n: number | null | undefined): string {
    return n == null ? "—" : n.toLocaleString("en-US");
  },
  bytes(mb: number | null | undefined): string {
    if (mb == null) return "—";
    if (mb >= 1024 * 1024) return (mb / 1024 / 1024).toFixed(2) + " TB";
    if (mb >= 1024) return (mb / 1024).toFixed(2) + " GB";
    if (mb >= 1) return mb.toFixed(1) + " MB";
    return (mb * 1024).toFixed(0) + " KB";
  },
  ms(ms: number | null | undefined): string {
    if (ms == null || ms === -1) return "Forever";
    const s = ms / 1000;
    if (s >= 86400 * 30) return Math.round(s / 86400 / 30) + "mo";
    if (s >= 86400) return Math.round(s / 86400) + "d";
    if (s >= 3600) return Math.round(s / 3600) + "h";
    if (s >= 60) return Math.round(s / 60) + "m";
    return s + "s";
  },
  rate(n: number | null | undefined): string {
    if (n == null) return "—";
    if (n >= 1e6) return (n / 1e6).toFixed(2) + "M/s";
    if (n >= 1e3) return (n / 1e3).toFixed(1) + "K/s";
    return n + "/s";
  },
  time(ts: number): string {
    const d = new Date(ts);
    return (
      d.toLocaleTimeString("en-US", { hour12: false }) +
      "." +
      String(d.getMilliseconds()).padStart(3, "0")
    );
  },
  ago(ts: number): string {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return s + "s ago";
    if (s < 3600) return Math.floor(s / 60) + "m ago";
    if (s < 86400) return Math.floor(s / 3600) + "h ago";
    return Math.floor(s / 86400) + "d ago";
  },
};
