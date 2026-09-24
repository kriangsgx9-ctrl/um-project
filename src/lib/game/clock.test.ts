import { describe, expect, it } from "vitest";
import {
  bangkokDayRangeUtc,
  bangkokWeekRangeUtc,
  getBangkokWeekKey,
  isWorkingDay,
  nextWorkingDay,
  toBangkokDateString,
  workingDaysBetweenExclusive,
} from "./clock";

describe("clock (Bangkok calendar)", () => {
  it("buckets a UTC instant into the correct Bangkok day across midnight", () => {
    // 2026-01-05T17:05:00Z = 2026-01-06T00:05 Bangkok (UTC+7)
    expect(toBangkokDateString(new Date("2026-01-05T17:05:00Z"))).toBe("2026-01-06");
    expect(toBangkokDateString(new Date("2026-01-05T16:59:00Z"))).toBe("2026-01-05");
  });

  it("isWorkingDay is Mon-Sat, not Sunday", () => {
    // 2026-01-05 is a Monday, 2026-01-11 is a Sunday
    expect(isWorkingDay(new Date("2026-01-05T04:00:00Z"))).toBe(true); // 11:00 Bangkok Monday
    expect(isWorkingDay(new Date("2026-01-10T04:00:00Z"))).toBe(true); // Saturday
    expect(isWorkingDay(new Date("2026-01-11T04:00:00Z"))).toBe(false); // Sunday
  });

  it("week key differs across the Sunday->Monday boundary", () => {
    const sunNight = new Date("2026-01-11T16:59:00Z"); // Sun 23:59 Bangkok
    const monMorning = new Date("2026-01-11T17:01:00Z"); // Mon 00:01 Bangkok
    expect(getBangkokWeekKey(sunNight)).not.toBe(getBangkokWeekKey(monMorning));
  });

  it("week key is stable across a whole week", () => {
    const mon = getBangkokWeekKey(new Date("2026-01-05T04:00:00Z"));
    const sat = getBangkokWeekKey(new Date("2026-01-10T04:00:00Z"));
    expect(mon).toBe(sat);
  });

  it("nextWorkingDay skips Sunday", () => {
    expect(nextWorkingDay("2026-01-10")).toBe("2026-01-12"); // Sat -> Mon
    expect(nextWorkingDay("2026-01-05")).toBe("2026-01-06"); // Mon -> Tue
  });

  it("workingDaysBetweenExclusive counts only Mon-Sat, Saturday->Monday is a 0-gap", () => {
    expect(workingDaysBetweenExclusive("2026-01-10", "2026-01-12")).toBe(0); // Sat -> Mon via Sunday
    expect(workingDaysBetweenExclusive("2026-01-05", "2026-01-06")).toBe(0); // consecutive days
    expect(workingDaysBetweenExclusive("2026-01-05", "2026-01-08")).toBe(2); // Tue, Wed skipped between Mon and Thu
  });

  it("day/week ranges bound the correct UTC instants", () => {
    const { start, end } = bangkokDayRangeUtc("2026-01-06");
    expect(toBangkokDateString(start)).toBe("2026-01-06");
    expect(toBangkokDateString(new Date(end.getTime() - 1))).toBe("2026-01-06");
    expect(toBangkokDateString(end)).toBe("2026-01-07");

    const wk = getBangkokWeekKey(new Date("2026-01-06T04:00:00Z"));
    const wr = bangkokWeekRangeUtc(wk);
    expect(getBangkokWeekKey(wr.start)).toBe(wk);
    expect(getBangkokWeekKey(new Date(wr.end.getTime() - 1))).toBe(wk);
  });
});
