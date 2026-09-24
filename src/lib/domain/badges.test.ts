import { describe, expect, it } from "vitest";
import { buildDemoSeed } from "./seed";
import { TIERED_BADGE_DEFS, tieredBadges } from "./badges";

describe("tiered badges (V2 §3.8)", () => {
  const { store } = buildDemoSeed();

  it("returns exactly the 10 spec'd badges for every user", () => {
    const result = tieredBadges(store, "u_um1", 0);
    expect(result.map((b) => b.k).sort()).toEqual(TIERED_BADGE_DEFS.map((d) => d.k).sort());
  });

  it("a badge below bronze threshold has tier=null and nextTier=bronze", () => {
    const result = tieredBadges(store, "u_um3", 0); // UM03 is early-stage, minimal recruitment activity
    const rec = result.find((b) => b.k === "rec")!;
    expect(rec.current).toBe(0);
    expect(rec.tier).toBeNull();
    expect(rec.nextTier).toBe("bronze");
    expect(rec.nextThreshold).toBe(10);
  });

  it("UM01 (>=10 candidates) has at least bronze Recruitment Builder", () => {
    const result = tieredBadges(store, "u_um1", 0);
    const rec = result.find((b) => b.k === "rec")!;
    expect(rec.current).toBeGreaterThanOrEqual(10);
    expect(rec.tier).not.toBeNull();
  });

  it("streak tier is driven entirely by the bestStreak parameter, not store data", () => {
    const low = tieredBadges(store, "u_um1", 5).find((b) => b.k === "streak")!;
    const high = tieredBadges(store, "u_um1", 60).find((b) => b.k === "streak")!;
    expect(low.tier).toBeNull();
    expect(high.tier).toBe("gold");
  });

  it("tier boundaries are inclusive at exact thresholds", () => {
    const atBronze = tieredBadges(store, "u_um1", 7).find((b) => b.k === "streak")!;
    const belowBronze = tieredBadges(store, "u_um1", 6).find((b) => b.k === "streak")!;
    expect(atBronze.tier).toBe("bronze");
    expect(belowBronze.tier).toBeNull();
  });

  it("gold tier has no nextTier/nextThreshold", () => {
    const gold = tieredBadges(store, "u_um1", 100).find((b) => b.k === "streak")!;
    expect(gold.tier).toBe("gold");
    expect(gold.nextTier).toBeNull();
    expect(gold.nextThreshold).toBeNull();
  });
});
