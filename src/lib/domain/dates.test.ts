import { describe, expect, it } from "vitest";
import { addDays, diffDays, iso, lastMonths, monthKey, toDate, weekStart } from "./dates";

describe("dates (Bangkok calendar)", () => {
  it("parses YYYY-MM-DD strings without timezone drift", () => {
    expect(iso("2026-01-06")).toBe("2026-01-06");
  });

  it("converts a UTC instant into the correct Bangkok calendar day", () => {
    // 2026-01-05T17:05:00Z = 2026-01-06T00:05 Bangkok (UTC+7)
    const d = toDate(new Date("2026-01-05T17:05:00Z"));
    expect(iso(d)).toBe("2026-01-06");
  });

  it("addDays / diffDays round-trip", () => {
    const base = toDate("2026-01-06");
    const later = addDays(base, 5);
    expect(iso(later)).toBe("2026-01-11");
    expect(diffDays(later, base)).toBe(5);
  });

  it("weekStart returns the Monday of the week", () => {
    // 2026-01-06 is a Tuesday
    expect(iso(weekStart("2026-01-06"))).toBe("2026-01-05");
    // 2026-01-05 is itself a Monday
    expect(iso(weekStart("2026-01-05"))).toBe("2026-01-05");
    // 2026-01-11 is a Sunday -> Monday of the same week is 2026-01-05
    expect(iso(weekStart("2026-01-11"))).toBe("2026-01-05");
  });

  it("monthKey and lastMonths", () => {
    expect(monthKey("2026-03-15")).toBe("2026-03");
    const months = lastMonths(3);
    expect(months).toHaveLength(3);
    expect(months[2]).toBe(monthKey(new Date()));
  });
});
