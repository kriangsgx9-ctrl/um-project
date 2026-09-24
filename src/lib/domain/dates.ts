// Calendar-day helpers for the program's operating timezone (Thailand).
// Ported from prototype/prime-um-ascend.html (today/iso/toDate/addDays/diffDays/weekStart/lastMonths),
// made explicitly Asia/Bangkok-aware so server behavior doesn't depend on host TZ.
//
// Internally, a "calendar day" is represented as a UTC-midnight Date carrying only
// {year, month, day} — arithmetic uses the UTC getters/setters exclusively so it is
// never affected by the host machine's own timezone. `toZonedTime` is the only place
// that actually consults the Asia/Bangkok offset, converting a real instant into the
// Bangkok wall-clock date before it is frozen into that UTC-midnight representation.
import { toZonedTime } from "date-fns-tz";

export const PROGRAM_TZ = "Asia/Bangkok";

function dayFromParts(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m, d));
}

/** Bangkok "today" at local midnight, represented as a UTC-midnight calendar-day Date. */
export function today(): Date {
  return toDate(new Date());
}

/** Parses a Date (instant) | 'YYYY-MM-DD' string into a Bangkok calendar-day Date. */
export function toDate(s: Date | string | null | undefined): Date {
  if (s instanceof Date) {
    // toZonedTime returns a Date whose *local* (host-timezone) getters read out the
    // target zone's wall-clock time — that's the API's contract, independent of host TZ.
    const zoned = toZonedTime(s, PROGRAM_TZ);
    return dayFromParts(zoned.getFullYear(), zoned.getMonth(), zoned.getDate());
  }
  if (!s) return today();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) {
    const [, y, mo, d] = m;
    return dayFromParts(Number(y), Number(mo) - 1, Number(d));
  }
  return toDate(new Date(s));
}

const pad = (n: number) => String(n).padStart(2, "0");

/** 'YYYY-MM-DD' for a calendar-day Date (or instant, converted to Bangkok first). */
export function iso(d: Date | string): string {
  const x = toDate(d);
  return `${x.getUTCFullYear()}-${pad(x.getUTCMonth() + 1)}-${pad(x.getUTCDate())}`;
}

export function addDays(d: Date | string, n: number): Date {
  const x = toDate(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

/** Whole calendar days between two dates (a - b), Bangkok-local. */
export function diffDays(a: Date | string, b: Date | string): number {
  return Math.round((toDate(a).getTime() - toDate(b).getTime()) / 86_400_000);
}

/** Monday of the Bangkok-local week containing d. */
export function weekStart(d: Date | string): Date {
  const x = toDate(d);
  const wd = (x.getUTCDay() + 6) % 7; // 0=Mon..6=Sun
  x.setUTCDate(x.getUTCDate() - wd);
  return x;
}

export function monthKey(d: Date | string): string {
  const x = toDate(d);
  return `${x.getUTCFullYear()}-${pad(x.getUTCMonth() + 1)}`;
}

/** The n most recent month keys, oldest first, ending at the current month. */
export function lastMonths(n: number): string[] {
  const d = today();
  d.setUTCDate(1);
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    out.push(monthKey(dayFromParts(d.getUTCFullYear(), d.getUTCMonth() - i, 1)));
  }
  return out;
}

export const sum = (a: number[]): number => a.reduce((x, y) => x + (Number(y) || 0), 0);
export const avg = (a: number[]): number => (a.length ? sum(a) / a.length : 0);
export const clamp = (v: number, a = 0, b = 100): number => Math.max(a, Math.min(b, v));
export const pct = (a: number, b: number): number => (b > 0 ? Math.round((a / b) * 100) : 0);

const fmtN = (n: number, dec = 0): string =>
  (Number(n) || 0).toLocaleString("th-TH", { maximumFractionDigits: dec, minimumFractionDigits: 0 });

/** Ported from the prototype's fmtMoney: compact Thai-baht formatting (฿1.2M / ฿45K / ฿900). */
export function fmtMoney(n: number): string {
  n = Number(n) || 0;
  if (Math.abs(n) >= 1e6) return "฿" + (n / 1e6).toLocaleString("th-TH", { maximumFractionDigits: 2 }) + "M";
  if (Math.abs(n) >= 1e4) return "฿" + (n / 1e3).toLocaleString("th-TH", { maximumFractionDigits: 1 }) + "K";
  return "฿" + fmtN(n);
}
