// The public API of the game engine. XP is ALWAYS computed server-side from
// `type` + the XP table + minimal context — callers never pass an `amount`, which
// is the concrete mechanism enforcing V2 spec §3.3's "XP คำนวณฝั่ง server เท่านั้น".
//
// sourceId contract (read this before calling awardXp for a new call site):
// the @@unique([userId, type, sourceType, sourceId]) constraint is the ONLY
// de-dupe mechanism, so sourceId must identify the exact event OCCURRENCE:
//   - evidence_submitted / evidence_verified -> `${evidenceId}:v${revisionCycle}`
//     (each submit-review-revise cycle is independently awardable)
//   - funnel_stage_move                      -> `${candidateId}#${stage}`
//     (each stage is awarded exactly once, ever — see awardFunnelStageXp)
//   - daily_mission_all3_bonus                -> `${userId}:${bangkokDay}`
//   - everything else                         -> the natural entity id (1 row = 1 occurrence)
import type { Prisma, PrismaClient } from "@prisma/client";
import { Prisma as PrismaNS } from "@prisma/client";
import { stagesBetween } from "@/lib/domain/funnel";
import { isWithinCap } from "./caps";
import { applyXpToProgress, getOrCreateProgress } from "./progress";
import { getGameSettings } from "./settings";
import { resolveXpAmount } from "./xp-table";
import type { AwardXpInput, AwardXpResult, ReverseXpInput, ReverseXpResult, XpEventRow } from "./types";

function isUniqueConstraintViolation(e: unknown): boolean {
  return e instanceof PrismaNS.PrismaClientKnownRequestError && e.code === "P2002";
}

export async function awardXp(db: PrismaClient, input: AwardXpInput): Promise<AwardXpResult> {
  return db.$transaction((tx) => awardXpTx(tx, input), { isolationLevel: "Serializable" });
}

export async function awardXpTx(tx: Prisma.TransactionClient, input: AwardXpInput): Promise<AwardXpResult> {
  const settings = await getGameSettings(tx);
  const amount = resolveXpAmount(input.type, settings.xpTable, input.context);
  const occurredAt = input.occurredAt ?? new Date();

  const capRule = settings.caps[input.type];
  if (capRule) {
    const { allowed } = await isWithinCap(tx, input.userId, input.type, capRule, occurredAt);
    if (!allowed) {
      return { awarded: false, amount: 0, skippedReason: "cap_exceeded", progress: await getOrCreateProgress(tx, input.userId) };
    }
  }

  let xpEvent: XpEventRow;
  try {
    xpEvent = await tx.xpEvent.create({
      data: {
        userId: input.userId,
        type: input.type,
        amount,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        reason: null,
        createdAt: occurredAt,
      },
    });
  } catch (e) {
    if (isUniqueConstraintViolation(e)) {
      return { awarded: false, amount: 0, skippedReason: "duplicate", progress: await getOrCreateProgress(tx, input.userId) };
    }
    throw e;
  }

  const progress = await applyXpToProgress(tx, input.userId, amount, {
    type: input.type,
    occurredAt,
    levelCurve: settings.levelCurve,
  });

  return { awarded: true, amount, xpEvent, progress };
}

/**
 * Awards each funnel stage crossed between fromStage and toStage exactly once,
 * ever (re-crossing a stage later, even after a reversal, is a no-op — see the
 * "Explicit product decision" note in reverseFunnelStageXp).
 */
export async function awardFunnelStageXp(
  db: PrismaClient,
  input: { userId: string; candidateId: string; fromStage: number; toStage: number; occurredAt?: Date }
): Promise<AwardXpResult[]> {
  const stages = stagesBetween(input.fromStage, input.toStage);
  return db.$transaction(
    async (tx) => {
      const results: AwardXpResult[] = [];
      for (const stage of stages) {
        results.push(
          await awardXpTx(tx, {
            userId: input.userId,
            type: "funnel_stage_move",
            sourceType: "candidate",
            sourceId: `${input.candidateId}#${stage}`,
            context: { stage },
            occurredAt: input.occurredAt,
          })
        );
      }
      return results;
    },
    { isolationLevel: "Serializable" }
  );
}

export async function reverseXp(db: PrismaClient, input: ReverseXpInput): Promise<ReverseXpResult> {
  return db.$transaction((tx) => reverseXpTx(tx, input), { isolationLevel: "Serializable" });
}

export async function reverseXpTx(tx: Prisma.TransactionClient, input: ReverseXpInput): Promise<ReverseXpResult> {
  const original = await tx.xpEvent.findUnique({
    where: {
      userId_type_sourceType_sourceId: {
        userId: input.userId,
        type: input.type,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
      },
    },
  });
  if (!original || original.amount <= 0) {
    return { reversed: false, amount: 0, skippedReason: "no_matching_award", progress: await getOrCreateProgress(tx, input.userId) };
  }

  let xpEvent: XpEventRow;
  try {
    // Same sourceType/sourceId as the original (type differs -> no collision with the
    // original row), so a SECOND reversal attempt collides with itself and is rejected.
    xpEvent = await tx.xpEvent.create({
      data: {
        userId: input.userId,
        type: "reversal",
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        amount: -original.amount,
        reason: `reversal_of:${original.id}; ${input.reason}`,
        createdAt: input.occurredAt ?? new Date(),
      },
    });
  } catch (e) {
    if (isUniqueConstraintViolation(e)) {
      return { reversed: false, amount: 0, skippedReason: "already_reversed", progress: await getOrCreateProgress(tx, input.userId) };
    }
    throw e;
  }

  const settings = await getGameSettings(tx);
  // Reversal deliberately never touches streak fields — a later-discovered quality
  // problem with past work shouldn't retroactively break a streak (§3.5's "never
  // scolding" spirit extends to not punishing today for something done days ago).
  const progress = await applyXpToProgress(tx, input.userId, -original.amount, {
    type: "reversal",
    occurredAt: new Date(),
    levelCurve: settings.levelCurve,
  });

  return { reversed: true, amount: -original.amount, xpEvent, progress };
}

export async function reverseFunnelStageXp(
  db: PrismaClient,
  input: { userId: string; candidateId: string; fromStage: number; toStage: number; reason: string }
): Promise<ReverseXpResult[]> {
  // fromStage is the OLD (higher) stage, toStage is the NEW (lower) stage after the
  // backward move — reverse every stage strictly above the new stage.
  const stagesToReverse = stagesBetween(input.toStage, input.fromStage);
  return db.$transaction(
    async (tx) => {
      const results: ReverseXpResult[] = [];
      for (const stage of stagesToReverse) {
        results.push(
          await reverseXpTx(tx, {
            userId: input.userId,
            type: "funnel_stage_move",
            sourceType: "candidate",
            sourceId: `${input.candidateId}#${stage}`,
            reason: input.reason,
          })
        );
      }
      return results;
    },
    { isolationLevel: "Serializable" }
  );
}
