import { describe, expect, it } from "vitest";
import { DEFAULT_XP_TABLE, FUNNEL_STAGE_XP, UnknownXpEventTypeError, resolveXpAmount } from "./xp-table";

describe("xp-table", () => {
  it("resolves every §3.2 table entry to the exact spec'd amount", () => {
    expect(resolveXpAmount("daily_mission_done", DEFAULT_XP_TABLE)).toBe(10);
    expect(resolveXpAmount("daily_mission_all3_bonus", DEFAULT_XP_TABLE)).toBe(20);
    expect(resolveXpAmount("quest_started", DEFAULT_XP_TABLE)).toBe(5);
    expect(resolveXpAmount("evidence_submitted", DEFAULT_XP_TABLE)).toBe(20);
    expect(resolveXpAmount("evidence_verified", DEFAULT_XP_TABLE)).toBe(80);
    expect(resolveXpAmount("quest_no_evidence_completed", DEFAULT_XP_TABLE)).toBe(40);
    expect(resolveXpAmount("kpi_logged", DEFAULT_XP_TABLE)).toBe(15);
    expect(resolveXpAmount("weekly_review_submitted", DEFAULT_XP_TABLE)).toBe(30);
    expect(resolveXpAmount("coaching_received", DEFAULT_XP_TABLE)).toBe(30);
    expect(resolveXpAmount("team_coaching_logged", DEFAULT_XP_TABLE)).toBe(25);
    expect(resolveXpAmount("gate_won", DEFAULT_XP_TABLE)).toBe(500);
    expect(resolveXpAmount("kudos_received", DEFAULT_XP_TABLE)).toBe(15);
  });

  it("resolves funnel_stage_move via the per-stage sub-table", () => {
    expect(resolveXpAmount("funnel_stage_move", DEFAULT_XP_TABLE, { stage: 1 })).toBe(10); // Contact
    expect(resolveXpAmount("funnel_stage_move", DEFAULT_XP_TABLE, { stage: 2 })).toBe(25); // Interview
    expect(resolveXpAmount("funnel_stage_move", DEFAULT_XP_TABLE, { stage: 3 })).toBe(35); // Presentation
    expect(resolveXpAmount("funnel_stage_move", DEFAULT_XP_TABLE, { stage: 5 })).toBe(50); // Commit
    expect(resolveXpAmount("funnel_stage_move", DEFAULT_XP_TABLE, { stage: 6 })).toBe(60); // Onboard
  });

  it("funnel_stage_move without a stage in context throws", () => {
    expect(() => resolveXpAmount("funnel_stage_move", DEFAULT_XP_TABLE)).toThrow();
  });

  it("a stage with no defined XP (e.g. prospect/follow-up) resolves to 0, not an error", () => {
    expect(resolveXpAmount("funnel_stage_move", DEFAULT_XP_TABLE, { stage: 0 })).toBe(0);
    expect(resolveXpAmount("funnel_stage_move", DEFAULT_XP_TABLE, { stage: 4 })).toBe(0);
    expect(FUNNEL_STAGE_XP[0]).toBeUndefined();
  });

  it("an unknown event type throws a typed error", () => {
    expect(() => resolveXpAmount("not_a_real_type" as never, DEFAULT_XP_TABLE)).toThrow(UnknownXpEventTypeError);
  });
});
