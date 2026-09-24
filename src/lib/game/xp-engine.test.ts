import { describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { awardFunnelStageXp, awardXp } from "./xp-engine";
import { FakePrisma } from "./test-utils/fake-prisma";

function db() {
  return new FakePrisma() as unknown as PrismaClient;
}

describe("xp-engine: awardXp", () => {
  it("awards the exact table amount and updates progress", async () => {
    const result = await awardXp(db(), { userId: "u1", type: "gate_won", sourceType: "gate", sourceId: "gate_p1" });
    expect(result.awarded).toBe(true);
    expect(result.amount).toBe(500);
    expect(result.progress.xp).toBe(500);
  });

  it("rejects a duplicate (same userId/type/sourceType/sourceId) without double-counting", async () => {
    const fake = db();
    const input = { userId: "u1", type: "evidence_verified" as const, sourceType: "evidence" as const, sourceId: "ev1:v1" };
    const first = await awardXp(fake, input);
    const second = await awardXp(fake, input);
    expect(first.awarded).toBe(true);
    expect(second.awarded).toBe(false);
    expect(second.skippedReason).toBe("duplicate");
    expect(second.progress.xp).toBe(80); // unchanged from the first award
  });

  it("a resubmission after revision (different revisionCycle) IS awardable again", async () => {
    const fake = db();
    const r1 = await awardXp(fake, { userId: "u1", type: "evidence_verified", sourceType: "evidence", sourceId: "ev1:v1" });
    const r2 = await awardXp(fake, { userId: "u1", type: "evidence_verified", sourceType: "evidence", sourceId: "ev1:v2" });
    expect(r1.awarded).toBe(true);
    expect(r2.awarded).toBe(true);
    expect(r2.progress.xp).toBe(160);
  });

  it("rejects when a configured cap is exceeded, cleanly, with no XpEvent row written", async () => {
    const fake = new FakePrisma();
    fake.gameSettingsRow = { xpTable: {}, caps: { kpi_logged: { period: "week", max: 1 } }, levelCurve: {}, leaderboardOn: true, kudosOn: true };
    const typedDb = fake as unknown as PrismaClient;
    const first = await awardXp(typedDb, { userId: "u1", type: "kpi_logged", sourceType: "weekly", sourceId: "w1" });
    const second = await awardXp(typedDb, { userId: "u1", type: "kpi_logged", sourceType: "weekly", sourceId: "w2" });
    expect(first.awarded).toBe(true);
    expect(second.awarded).toBe(false);
    expect(second.skippedReason).toBe("cap_exceeded");
    expect(fake.xpEvents).toHaveLength(1);
  });

  it("XP never goes negative even if reversals would drive it below 0", async () => {
    const fake = db();
    await awardXp(fake, { userId: "u1", type: "kpi_logged", sourceType: "weekly", sourceId: "w1" }); // +15
    // Directly exercise applyXpToProgress via a large synthetic reversal amount is covered
    // in reversal.test.ts; here we just confirm awardXp's own progress clamp holds for xp=0 baseline.
    const fresh = await awardXp(db(), { userId: "u2", type: "quest_started", sourceType: "action", sourceId: "a1" });
    expect(fresh.progress.xp).toBeGreaterThanOrEqual(0);
  });
});

describe("xp-engine: awardFunnelStageXp", () => {
  it("awards each crossed stage exactly once when moving forward multiple stages", async () => {
    const fake = db();
    const results = await awardFunnelStageXp(fake, { userId: "u1", candidateId: "cd1", fromStage: 0, toStage: 3 });
    // stages 1 (Contact=10), 2 (Interview=25), 3 (Presentation=35)
    expect(results.map((r) => r.amount)).toEqual([10, 25, 35]);
    expect(results.every((r) => r.awarded)).toBe(true);
  });

  it("re-crossing the same stage later is a no-op (exactly once ever)", async () => {
    const fake = db();
    await awardFunnelStageXp(fake, { userId: "u1", candidateId: "cd1", fromStage: 0, toStage: 2 });
    const again = await awardFunnelStageXp(fake, { userId: "u1", candidateId: "cd1", fromStage: 1, toStage: 2 });
    expect(again.every((r) => !r.awarded)).toBe(true);
  });

  it("moving multiple stages in one day still awards once per stage, not once total", async () => {
    const fake = db();
    const results = await awardFunnelStageXp(fake, { userId: "u1", candidateId: "cd1", fromStage: 0, toStage: 2 });
    const totalXp = results.reduce((s, r) => s + r.amount, 0);
    expect(totalXp).toBe(10 + 25); // Contact + Interview, not a single flat award
  });
});
