// UserProgress is a derived, rebuildable cache — XpEvent is the only source of
// truth. `applyXpToProgress` is the live incremental path; `recalculateProgress`
// is the full replay path (powers the Admin "Recalculate XP" feature, §7). Both
// must agree, which is exactly what progress-recalculate.test.ts pins down.
import type { Prisma, PrismaClient } from "@prisma/client";
import { toBangkokDateString, getBangkokWeekKey } from "./clock";
import { levelForXp, type LevelCurveConfig, DEFAULT_LEVEL_CURVE } from "./level";
import {
  advanceStreak,
  advanceWeeklyReviewStreak,
  replayStreak,
  replayWeeklyReviewStreak,
  type StreakState,
} from "./streak";
import type { UserProgressRow, XpEventType } from "./types";

type Db = PrismaClient | Prisma.TransactionClient;

/** Live-update path only drives the streak machine for these event types. */
const DAILY_STREAK_TRIGGER_TYPES = new Set<XpEventType>(["daily_mission_done"]);

function toRow(p: {
  userId: string;
  xp: number;
  level: number;
  streak: number;
  bestStreak: number;
  shieldsLeft: number;
  lastActiveDate: string | null;
  weeklyReviewStreak: number;
  weeklyReviewBestStreak: number;
  lastWeeklyReviewWeek: string | null;
}): UserProgressRow {
  return { ...p };
}

export async function getOrCreateProgress(db: Db, userId: string): Promise<UserProgressRow> {
  const existing = await db.userProgress.findUnique({ where: { userId } });
  if (existing) return toRow(existing);
  const created = await db.userProgress.create({
    data: { userId, xp: 0, level: 1, streak: 0, bestStreak: 0, shieldsLeft: 1 },
  });
  return toRow(created);
}

export interface ApplyXpContext {
  type: XpEventType;
  occurredAt: Date;
  levelCurve: LevelCurveConfig;
}

export async function applyXpToProgress(db: Db, userId: string, delta: number, ctx: ApplyXpContext): Promise<UserProgressRow> {
  const current = await getOrCreateProgress(db, userId);
  const xp = Math.max(0, current.xp + delta);
  const level = levelForXp(xp, ctx.levelCurve ?? DEFAULT_LEVEL_CURVE);

  let streakFields: Pick<UserProgressRow, "streak" | "bestStreak" | "shieldsLeft" | "lastActiveDate"> = {
    streak: current.streak,
    bestStreak: current.bestStreak,
    shieldsLeft: current.shieldsLeft,
    lastActiveDate: current.lastActiveDate,
  };
  let weeklyReviewFields: Pick<UserProgressRow, "weeklyReviewStreak" | "weeklyReviewBestStreak" | "lastWeeklyReviewWeek"> = {
    weeklyReviewStreak: current.weeklyReviewStreak,
    weeklyReviewBestStreak: current.weeklyReviewBestStreak,
    lastWeeklyReviewWeek: current.lastWeeklyReviewWeek,
  };

  if (delta > 0 && DAILY_STREAK_TRIGGER_TYPES.has(ctx.type)) {
    const state: StreakState = {
      streak: current.streak,
      bestStreak: current.bestStreak,
      shieldsLeft: current.shieldsLeft,
      lastActiveDate: current.lastActiveDate,
    };
    const r = advanceStreak(state, toBangkokDateString(ctx.occurredAt));
    streakFields = { streak: r.streak, bestStreak: r.bestStreak, shieldsLeft: r.shieldsLeft, lastActiveDate: r.lastActiveDate };
  }

  if (delta > 0 && ctx.type === "weekly_review_submitted") {
    const state: StreakState = {
      streak: current.weeklyReviewStreak,
      bestStreak: current.weeklyReviewBestStreak,
      shieldsLeft: 0,
      lastActiveDate: current.lastWeeklyReviewWeek,
    };
    const r = advanceWeeklyReviewStreak(state, getBangkokWeekKey(ctx.occurredAt));
    weeklyReviewFields = { weeklyReviewStreak: r.streak, weeklyReviewBestStreak: r.bestStreak, lastWeeklyReviewWeek: r.lastActiveDate };
  }

  const updated = await db.userProgress.update({
    where: { userId },
    data: { xp, level, ...streakFields, ...weeklyReviewFields },
  });
  return toRow(updated);
}

export interface ReplaySourceEvent {
  type: XpEventType;
  amount: number;
  createdAt: Date;
}

/**
 * Rebuilds a UserProgress from scratch given every XpEvent for a user, in any order.
 * Must produce exactly what incrementally calling applyXpToProgress for each event
 * (in chronological order) would have produced — see progress-recalculate.test.ts.
 */
export function recalculateProgressFromEvents(
  events: ReplaySourceEvent[],
  levelCurve: LevelCurveConfig = DEFAULT_LEVEL_CURVE
): Omit<UserProgressRow, "userId"> {
  const sorted = [...events].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const xp = Math.max(
    0,
    sorted.reduce((sum, e) => sum + e.amount, 0)
  );
  const level = levelForXp(xp, levelCurve);

  const dailyDays = sorted
    .filter((e) => e.amount > 0 && DAILY_STREAK_TRIGGER_TYPES.has(e.type))
    .map((e) => toBangkokDateString(e.createdAt));
  const streakState = replayStreak(dailyDays);

  const reviewWeeks = sorted
    .filter((e) => e.amount > 0 && e.type === "weekly_review_submitted")
    .map((e) => getBangkokWeekKey(e.createdAt));
  const weeklyState = replayWeeklyReviewStreak(reviewWeeks);

  return {
    xp,
    level,
    streak: streakState.streak,
    bestStreak: streakState.bestStreak,
    shieldsLeft: streakState.shieldsLeft,
    lastActiveDate: streakState.lastActiveDate,
    weeklyReviewStreak: weeklyState.streak,
    weeklyReviewBestStreak: weeklyState.bestStreak,
    lastWeeklyReviewWeek: weeklyState.lastActiveDate,
  };
}

export async function recalculateProgress(db: Db, userId: string): Promise<UserProgressRow> {
  const events = await db.xpEvent.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
  const settingsRow = await db.gameSettings.findUnique({ where: { id: "default" } });
  const levelCurve = { ...DEFAULT_LEVEL_CURVE, ...((settingsRow?.levelCurve as Partial<LevelCurveConfig>) ?? {}) };
  const rebuilt = recalculateProgressFromEvents(
    events.map((e) => ({ type: e.type as XpEventType, amount: e.amount, createdAt: e.createdAt })),
    levelCurve
  );
  const updated = await db.userProgress.upsert({
    where: { userId },
    create: { userId, ...rebuilt },
    update: rebuilt,
  });
  return toRow(updated);
}
