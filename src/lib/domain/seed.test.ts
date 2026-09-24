import { describe, expect, it } from "vitest";
import { buildDemoSeed } from "./seed";
import { curPhase, isOverdue, overallProgress, phaseProgress, userById } from "./actions";
import { funnelCounts } from "./funnel";
import { gateRequirements, gateStatus } from "./gate";
import { readiness } from "./readiness";
import { risks, riskLevel } from "./risk";
import { todayItems, weeklyPriorities } from "./priorities";
import { badges } from "./badges";

describe("demo seed fidelity (matches prototype's seed() behavior)", () => {
  const { store } = buildDemoSeed();

  it("seeds the 6 demo accounts with the expected roles/phases", () => {
    expect(store.users.map((u) => u.id)).toEqual(["u_um1", "u_um2", "u_um3", "u_coach1", "u_al1", "u_admin1"]);
    expect(userById(store, "u_um1")?.currentPhase).toBe(4);
    expect(userById(store, "u_um2")?.currentPhase).toBe(3);
    expect(userById(store, "u_um3")?.currentPhase).toBe(2);
  });

  it("UM01 has completed all required actions of phases before RECRUIT", () => {
    const p1 = store.phases.find((p) => p.id === "p1")!;
    expect(phaseProgress(store, userById(store, "u_um1")!, p1)).toBe(100);
  });

  it("UM01 overall progress is between 0 and 100 and reflects partial RECRUIT completion", () => {
    const progress = overallProgress(store, userById(store, "u_um1")!);
    expect(progress).toBeGreaterThan(0);
    expect(progress).toBeLessThan(100);
  });

  it("funnelCounts is monotonically non-increasing across stages for UM01", () => {
    const counts = funnelCounts(store, "u_um1");
    for (let i = 1; i < counts.length; i++) expect(counts[i]).toBeLessThanOrEqual(counts[i - 1]);
    expect(counts[0]).toBeGreaterThan(0); // has candidates at prospect+
  });

  it("gateRequirements/gateStatus for UM01's current phase (RECRUIT) are internally consistent", () => {
    const u = userById(store, "u_um1")!;
    const p = curPhase(store, u)!;
    expect(p.key).toBe("RECRUIT");
    const reqs = gateRequirements(store, u, p);
    const status = gateStatus(store, u, p);
    const allOk = reqs.every((r) => r.ok);
    expect(status.k).toBe(allOk ? "ready" : "open");
  });

  it("gateStatus is 'passed' for a phase already completed (UM01 / DISCOVER)", () => {
    const u = userById(store, "u_um1")!;
    const p1 = store.phases.find((p) => p.id === "p1")!;
    expect(gateStatus(store, u, p1).k).toBe("passed");
  });

  it("readiness returns a total in [0,100] and all 5 dimensions for every Future UM", () => {
    for (const uid of ["u_um1", "u_um2", "u_um3"]) {
      const r = readiness(store, uid);
      expect(r.total).toBeGreaterThanOrEqual(0);
      expect(r.total).toBeLessThanOrEqual(100);
      expect(Object.keys(r.dims).sort()).toEqual(["development", "leadership", "management", "production", "recruitment"]);
    }
  });

  it("UM03 (behind schedule, needs_revision evidence) has a worse readiness total than UM01", () => {
    expect(readiness(store, "u_um3").total).toBeLessThan(readiness(store, "u_um1").total);
  });

  it("risks()/riskLevel() agree on severity", () => {
    for (const uid of ["u_um1", "u_um2", "u_um3"]) {
      const r = risks(store, uid);
      const lvl = riskLevel(store, uid);
      if (r.some((x) => x.lvl === "red")) expect(lvl).toBe("red");
      else if (r.length) expect(lvl).toBe("amber");
      else expect(lvl).toBe("green");
    }
  });

  it("UM03's overdue needs_revision action (a202) is flagged overdue, and risks() runs without throwing", () => {
    const u = userById(store, "u_um3")!;
    expect(isOverdue(store, u, store.actions.find((a) => a.id === "a202")!)).toBe(true);
    const r = risks(store, "u_um3");
    expect(Array.isArray(r)).toBe(true);
  });

  it("todayItems returns action/coaching/candidate items sorted with overdue first", () => {
    const items = todayItems(store, userById(store, "u_um1")!);
    expect(Array.isArray(items)).toBe(true);
    for (let i = 1; i < items.length; i++) {
      if (items[i - 1].overdue !== items[i].overdue) {
        expect(Number(items[i - 1].overdue)).toBeGreaterThanOrEqual(Number(items[i].overdue));
      }
    }
  });

  it("weeklyPriorities returns at most 3 items", () => {
    for (const uid of ["u_um1", "u_um2", "u_um3"]) {
      expect(weeklyPriorities(store, userById(store, uid)!).length).toBeLessThanOrEqual(3);
    }
  });

  it("badges() reports Recruitment Builder=ok for UM01 (>=10 candidates) but not for UM03 (0 candidates)", () => {
    const b1 = badges(store, "u_um1").find((b) => b.k === "rec")!;
    const b3 = badges(store, "u_um3").find((b) => b.k === "rec")!;
    expect(b1.ok).toBe(true);
    expect(b3.ok).toBe(false);
  });
});
