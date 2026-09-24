import { describe, expect, it } from "vitest";
import { bangkokWeekRangeUtc, getBangkokWeekKey } from "./clock";
import { countEventsInPeriod, isWithinCap } from "./caps";
import { FakePrisma } from "./test-utils/fake-prisma";

describe("caps (anti-gaming, admin-configurable)", () => {
  it("enforces a weekly cap and rejects once the max is reached", async () => {
    const db = new FakePrisma();
    const ref = new Date("2026-01-06T04:00:00Z"); // Tue Bangkok
    await db.xpEvent.create({ data: { userId: "u1", type: "kpi_logged", amount: 15, sourceType: "weekly", sourceId: "w1", reason: null, createdAt: ref } });

    const rule = { period: "week" as const, max: 1 };
    const check = await isWithinCap(db as never, "u1", "kpi_logged", rule, ref);
    expect(check.allowed).toBe(false);
    expect(check.current).toBe(1);
  });

  it("weekly cap boundary: Sun 23:59 and Mon 00:01 Bangkok count toward different weeks", async () => {
    const db = new FakePrisma();
    const sunNight = new Date("2026-01-11T16:59:00Z"); // Sun 23:59 Bangkok
    const monMorning = new Date("2026-01-11T17:01:00Z"); // Mon 00:01 Bangkok
    await db.xpEvent.create({ data: { userId: "u1", type: "team_coaching_logged", amount: 25, sourceType: "coaching", sourceId: "c1", reason: null, createdAt: sunNight } });

    const countForMonday = await countEventsInPeriod(db as never, "u1", "team_coaching_logged", "week", monMorning);
    expect(countForMonday).toBe(0); // the Sunday event belongs to the previous week

    expect(getBangkokWeekKey(sunNight)).not.toBe(getBangkokWeekKey(monMorning));
  });

  it("admin-overridden cap values change behavior without a code change", async () => {
    const db = new FakePrisma();
    const ref = new Date("2026-01-06T04:00:00Z");
    for (let i = 0; i < 3; i++) {
      await db.xpEvent.create({ data: { userId: "u1", type: "team_coaching_logged", amount: 25, sourceType: "coaching", sourceId: `c${i}`, reason: null, createdAt: ref } });
    }
    const strict = await isWithinCap(db as never, "u1", "team_coaching_logged", { period: "week", max: 3 }, ref);
    expect(strict.allowed).toBe(false);
    const lenient = await isWithinCap(db as never, "u1", "team_coaching_logged", { period: "week", max: 10 }, ref);
    expect(lenient.allowed).toBe(true);
  });

  it("reversal events never count toward the original type's cap", async () => {
    const db = new FakePrisma();
    const ref = new Date("2026-01-06T04:00:00Z");
    await db.xpEvent.create({ data: { userId: "u1", type: "reversal", amount: -15, sourceType: "weekly", sourceId: "w1", reason: "test", createdAt: ref } });
    const count = await countEventsInPeriod(db as never, "u1", "kpi_logged", "week", ref);
    expect(count).toBe(0);
  });

  it("bangkokWeekRangeUtc bounds match getBangkokWeekKey for instants inside it", () => {
    const wk = getBangkokWeekKey(new Date("2026-01-06T04:00:00Z"));
    const { start, end } = bangkokWeekRangeUtc(wk);
    expect(getBangkokWeekKey(start)).toBe(wk);
    expect(getBangkokWeekKey(new Date(end.getTime() - 1))).toBe(wk);
    expect(getBangkokWeekKey(end)).not.toBe(wk);
  });
});
