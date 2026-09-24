import { describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { awardFunnelStageXp, awardXp, reverseXp } from "./xp-engine";
import { recalculateProgress, recalculateProgressFromEvents } from "./progress";
import { FakePrisma } from "./test-utils/fake-prisma";

function db() {
  return new FakePrisma() as unknown as PrismaClient;
}

describe("progress recalculation (rebuildable cache)", () => {
  it("recalculateProgress reproduces exactly what the incremental path produced", async () => {
    const fake = db();
    await awardXp(fake, { userId: "u1", type: "daily_mission_done", sourceType: "mission", sourceId: "m1", occurredAt: new Date("2026-01-05T04:00:00Z") });
    await awardXp(fake, { userId: "u1", type: "daily_mission_done", sourceType: "mission", sourceId: "m2", occurredAt: new Date("2026-01-06T04:00:00Z") });
    await awardXp(fake, { userId: "u1", type: "evidence_verified", sourceType: "evidence", sourceId: "ev1:v1", occurredAt: new Date("2026-01-06T05:00:00Z") });
    const afterIncremental = await reverseXp(fake, {
      userId: "u1",
      type: "evidence_verified",
      sourceType: "evidence",
      sourceId: "ev1:v1",
      reason: "revision",
      occurredAt: new Date("2026-01-07T04:00:00Z"),
    });

    const rebuilt = await recalculateProgress(fake as unknown as PrismaClient, "u1");

    expect(rebuilt.xp).toBe(afterIncremental.progress.xp);
    expect(rebuilt.streak).toBe(afterIncremental.progress.streak);
    expect(rebuilt.bestStreak).toBe(afterIncremental.progress.bestStreak);
    expect(rebuilt.level).toBe(afterIncremental.progress.level);
  });

  it("is idempotent when run twice", async () => {
    const fake = db();
    await awardXp(fake, { userId: "u1", type: "gate_won", sourceType: "gate", sourceId: "gate_p1" });
    const first = await recalculateProgress(fake as unknown as PrismaClient, "u1");
    const second = await recalculateProgress(fake as unknown as PrismaClient, "u1");
    expect(second).toEqual(first);
  });

  it("recalculateProgressFromEvents matches manual XP summation and level lookup", () => {
    const events = [
      { type: "gate_won" as const, amount: 500, createdAt: new Date("2026-01-01T00:00:00Z") },
      { type: "kpi_logged" as const, amount: 15, createdAt: new Date("2026-01-02T00:00:00Z") },
      { type: "reversal" as const, amount: -15, createdAt: new Date("2026-01-03T00:00:00Z") },
    ];
    const result = recalculateProgressFromEvents(events);
    expect(result.xp).toBe(500);
  });

  it("full replay across multiple funnel-stage awards and a reversal matches incremental state", async () => {
    const fake = db();
    await awardFunnelStageXp(fake, { userId: "u1", candidateId: "cd1", fromStage: 0, toStage: 3 });
    const incremental = await fake.userProgress.findUnique({ where: { userId: "u1" } });
    const rebuilt = await recalculateProgress(fake as unknown as PrismaClient, "u1");
    expect(rebuilt.xp).toBe(incremental?.xp);
  });
});
