import { describe, expect, it } from "vitest";
import { buildDemoSeed } from "./seed";
import { userById } from "./actions";
import { generateDailyMissionCandidates, pickDailyMissions, type DailyMissionCandidate } from "./daily-missions";

describe("daily missions", () => {
  const { store } = buildDemoSeed();

  it("generates candidates with distinct kinds, each a real app path (not a prototype hash-link)", () => {
    const candidates = generateDailyMissionCandidates(store, userById(store, "u_um1")!);
    const kinds = candidates.map((c) => c.kind);
    expect(new Set(kinds).size).toBe(kinds.length); // no duplicate kinds
    for (const c of candidates) {
      expect(c.link.startsWith("#")).toBe(false);
      expect(c.link.startsWith("/")).toBe(true);
      expect(c.target).toBeGreaterThan(0);
    }
  });

  it("UM01 (has active candidates due) gets a call_candidates mission for up to 2 people", () => {
    const candidates = generateDailyMissionCandidates(store, userById(store, "u_um1")!);
    const mission = candidates.find((c) => c.kind === "call_candidates");
    expect(mission).toBeDefined();
    expect(mission!.target).toBeLessThanOrEqual(2);
  });

  it("pickDailyMissions returns at most 3", () => {
    const candidates = generateDailyMissionCandidates(store, userById(store, "u_um1")!);
    const picked = pickDailyMissions(candidates, []);
    expect(picked.length).toBeLessThanOrEqual(3);
    expect(picked.length).toBeLessThanOrEqual(candidates.length);
  });

  it("excludes a kind that ran on both of the last 2 days (3rd consecutive day rule)", () => {
    const candidates: DailyMissionCandidate[] = [
      { kind: "call_candidates", title: "a", target: 1, link: "/recruitment" },
      { kind: "quest_step", title: "b", target: 1, link: "/actions/1" },
      { kind: "log_kpi", title: "c", target: 1, link: "/performance" },
    ];
    const picked = pickDailyMissions(candidates, [["call_candidates", "quest_step"], ["call_candidates", "log_kpi"]]);
    // "call_candidates" appeared on both of the last 2 days -> excluded today
    expect(picked.map((c) => c.kind)).not.toContain("call_candidates");
    expect(picked.map((c) => c.kind)).toEqual(["quest_step", "log_kpi"]);
  });

  it("a kind used on only ONE of the last 2 days is still allowed (2-in-a-row is fine)", () => {
    const candidates: DailyMissionCandidate[] = [{ kind: "call_candidates", title: "a", target: 1, link: "/recruitment" }];
    const picked = pickDailyMissions(candidates, [["call_candidates"], ["log_kpi"]]);
    expect(picked.map((c) => c.kind)).toEqual(["call_candidates"]);
  });

  it("with no recent history, nothing is excluded", () => {
    const candidates = generateDailyMissionCandidates(store, userById(store, "u_um1")!);
    expect(pickDailyMissions(candidates, [[], []])).toHaveLength(Math.min(3, candidates.length));
  });
});
