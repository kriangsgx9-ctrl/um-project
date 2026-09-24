import { describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { awardFunnelStageXp, awardXp, reverseFunnelStageXp, reverseXp } from "./xp-engine";
import { FakePrisma } from "./test-utils/fake-prisma";

function db() {
  return new FakePrisma() as unknown as PrismaClient;
}

describe("reversal", () => {
  it("reverses exactly the evidence_verified award (evidence -> Revision)", async () => {
    const fake = db();
    await awardXp(fake, { userId: "u1", type: "evidence_verified", sourceType: "evidence", sourceId: "ev1:v1" });
    const before = await awardXp(fake, { userId: "u1", type: "evidence_submitted", sourceType: "evidence", sourceId: "ev1" });
    expect(before.progress.xp).toBe(100); // 80 + 20

    const result = await reverseXp(fake, { userId: "u1", type: "evidence_verified", sourceType: "evidence", sourceId: "ev1:v1", reason: "sent back for revision" });
    expect(result.reversed).toBe(true);
    expect(result.amount).toBe(-80);
    expect(result.progress.xp).toBe(20); // the submission credit for the work done stays
  });

  it("reversing a non-existent award is a safe no-op", async () => {
    const fake = db();
    const result = await reverseXp(fake, { userId: "u1", type: "evidence_verified", sourceType: "evidence", sourceId: "never-awarded", reason: "n/a" });
    expect(result.reversed).toBe(false);
    expect(result.skippedReason).toBe("no_matching_award");
  });

  it("reversing twice is a safe no-op the second time", async () => {
    const fake = db();
    await awardXp(fake, { userId: "u1", type: "gate_won", sourceType: "gate", sourceId: "gate_p1" });
    const first = await reverseXp(fake, { userId: "u1", type: "gate_won", sourceType: "gate", sourceId: "gate_p1", reason: "mistaken approval" });
    const second = await reverseXp(fake, { userId: "u1", type: "gate_won", sourceType: "gate", sourceId: "gate_p1", reason: "mistaken approval" });
    expect(first.reversed).toBe(true);
    expect(second.reversed).toBe(false);
    expect(second.skippedReason).toBe("already_reversed");
  });

  it("reversal never mutates streak fields", async () => {
    const fake = db();
    const awarded = await awardXp(fake, { userId: "u1", type: "daily_mission_done", sourceType: "mission", sourceId: "m1", occurredAt: new Date("2026-01-05T04:00:00Z") });
    expect(awarded.progress.streak).toBe(1);
    const reversed = await reverseXp(fake, { userId: "u1", type: "daily_mission_done", sourceType: "mission", sourceId: "m1", reason: "logged in error" });
    expect(reversed.progress.streak).toBe(1); // untouched, even though the XP is gone
    expect(reversed.progress.xp).toBe(0);
  });

  it("backward funnel move reverses exactly the now-uncrossed stages, leaving earlier stages intact", async () => {
    const fake = db();
    await awardFunnelStageXp(fake, { userId: "u1", candidateId: "cd1", fromStage: 0, toStage: 3 }); // Contact+Interview+Presentation = 70
    const results = await reverseFunnelStageXp(fake, { userId: "u1", candidateId: "cd1", fromStage: 3, toStage: 1, reason: "candidate declined, moved back to Contact" });
    expect(results.every((r) => r.reversed)).toBe(true);
    const totalReversed = results.reduce((s, r) => s + r.amount, 0);
    expect(totalReversed).toBe(-(25 + 35)); // Interview + Presentation reversed; Contact (stage 1) stays

    const progress = await fake.userProgress.findUnique({ where: { userId: "u1" } });
    expect(progress?.xp).toBe(10); // only Contact's 10 XP remains
  });

  it("re-advancing after a reversed stage does not re-award (pinned behavior)", async () => {
    const fake = db();
    await awardFunnelStageXp(fake, { userId: "u1", candidateId: "cd1", fromStage: 0, toStage: 2 });
    await reverseFunnelStageXp(fake, { userId: "u1", candidateId: "cd1", fromStage: 2, toStage: 1, reason: "moved back" });
    const reAdvance = await awardFunnelStageXp(fake, { userId: "u1", candidateId: "cd1", fromStage: 1, toStage: 2 });
    expect(reAdvance.every((r) => !r.awarded)).toBe(true);
  });
});
