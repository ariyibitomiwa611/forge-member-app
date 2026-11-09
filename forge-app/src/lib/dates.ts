export const DAY_MS = 86_400_000;

const pad = (n: number) => String(n).padStart(2, "0");

/** Local-date ISO string, e.g. "2026-09-24". */
export const toIso = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parseIso = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export const mondayOf = (d: Date) => {
  const g = d.getDay();
  return addDays(d, g === 0 ? -6 : 1 - g);
};

export const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

/** Small deterministic PRNG so demo data is stable between reloads. */
export const rng = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

export const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const WD_LETTER = ["S", "M", "T", "W", "T", "F", "S"];
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
