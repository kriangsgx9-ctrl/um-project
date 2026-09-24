// Asia/Bangkok calendar-day / week-key utilities for the game engine.
// Built on lib/domain/dates' Bangkok-aware primitives (today/toDate/iso/diffDays/
// weekStart) for calendar-day bucketing and arithmetic. Those primitives represent
// a "calendar day" as a UTC-midnight token (self-consistent for day-string math,
// but NOT a real instant), so range-boundary functions here that must produce
// genuine UTC instants (for DB range queries) go through date-fns-tz's
// `fromZonedTime` directly instead — the only place that happens.
import { addDays, diffDays, iso, toDate, weekStart } from "@/lib/domain/dates";
import { fromZonedTime } from "date-fns-tz";

export const GAME_TZ = "Asia/Bangkok";

/** 'YYYY-MM-DD' Bangkok calendar day for any instant. */
export function toBangkokDateString(instant: Date): string {
  return iso(instant);
}

/** 0=Sun..6=Sat, Bangkok-local. */
export function getBangkokDow(instant: Date): number {
  return toDate(instant).getUTCDay();
}

/** Mon-Sat only — Sunday is not a working day (does not break the streak, but doesn't build it either). */
export function isWorkingDay(instant: Date): boolean {
  return getBangkokDow(instant) !== 0;
}

/** ISO-ish Monday-start week key, e.g. '2026-W07', in Bangkok-local terms. */
export function getBangkokWeekKey(instant: Date): string {
  const monday = weekStart(instant);
  // Week 1 is the week containing Jan 1 of that Monday's year-ish bucket; since we only
  // need stable, comparable, sortable keys (not calendar-correct ISO week numbers), we
  // derive the key directly from the Monday's own date — simpler and free of the
  // ISO week-numbering edge cases (year-boundary weeks) that don't matter for our use.
  return "W" + iso(monday);
}

/** [start, end) UTC instant bounds for the Bangkok calendar day `dayString` ('YYYY-MM-DD'). */
export function bangkokDayRangeUtc(dayString: string): { start: Date; end: Date } {
  const start = fromZonedTime(`${dayString}T00:00:00`, GAME_TZ);
  const end = new Date(start.getTime() + 86_400_000);
  return { start, end };
}

/** [start, end) UTC instant bounds for the Bangkok week identified by `weekKey` (from getBangkokWeekKey). */
export function bangkokWeekRangeUtc(weekKey: string): { start: Date; end: Date } {
  const mondayIso = weekKey.slice(1); // strip leading 'W'
  const start = fromZonedTime(`${mondayIso}T00:00:00`, GAME_TZ);
  const end = new Date(start.getTime() + 7 * 86_400_000);
  return { start, end };
}

/** Sat -> Mon (skip Sun), else the very next calendar day. Bangkok-local. */
export function nextWorkingDay(dayString: string): string {
  const d = toDate(dayString);
  const dow = d.getUTCDay(); // 0=Sun..6=Sat
  const add = dow === 6 ? 2 : 1;
  return iso(addDays(d, add));
}

/**
 * Count of Mon-Sat working days strictly between two Bangkok calendar days
 * (exclusive of `fromDay`, exclusive of `toDay`). Used to detect streak gaps:
 * 0 means "the very next working day", independent of how many Sundays sit between.
 */
export function workingDaysBetweenExclusive(fromDay: string, toDay: string): number {
  const totalDays = diffDays(toDay, fromDay);
  if (totalDays <= 0) return 0;
  let count = 0;
  for (let i = 1; i < totalDays; i++) {
    if (isWorkingDay(addDays(fromDay, i))) count++;
  }
  return count;
}
