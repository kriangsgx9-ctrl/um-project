// Streak / Streak Shield per PRIME_UM_ASCEND_V2_GAME_MODE.md §3.5.
// A pure, side-effect-free state machine used both for live incremental updates
// (progress.ts) and for full recompute (recalculateProgress) — so the two paths
// can never drift apart. All day/week arguments are Bangkok calendar-day strings
// ('YYYY-MM-DD') / week keys (getBangkokWeekKey), never raw instants.
import { getBangkokWeekKey, workingDaysBetweenExclusive } from "./clock";
import { toDate } from "@/lib/domain/dates";

export interface StreakState {
  streak: number;
  bestStreak: number;
  /** 0 or 1 — "one Streak Shield per week", auto-consumed. */
  shieldsLeft: number;
  lastActiveDate: string | null;
}

export const INITIAL_STREAK_STATE: StreakState = {
  streak: 0,
  bestStreak: 0,
  shieldsLeft: 1,
  lastActiveDate: null,
};

export type StreakOutcome = "first_activity" | "same_day_noop" | "continued" | "shield_used" | "reset";

export interface AdvanceStreakResult extends StreakState {
  outcome: StreakOutcome;
  /** Always encouraging on 'reset' per §3.5 ("ให้กำลังใจ ไม่ตำหนิ") — never scolding. */
  message: string;
}

function weekKeyOf(day: string): string {
  return getBangkokWeekKey(toDate(day));
}

/**
 * Advances the streak state machine by one activity on `activityDay`.
 * Mon-Sat only matters for streak continuity; Sunday activity is accepted (same-day
 * dedupe still applies) but streak-continuity gap counting only ever measures
 * working days, so a Sunday does not break the streak either way.
 */
export function advanceStreak(state: StreakState, activityDay: string): AdvanceStreakResult {
  if (!state.lastActiveDate) {
    return {
      ...state,
      streak: 1,
      bestStreak: Math.max(state.bestStreak, 1),
      lastActiveDate: activityDay,
      outcome: "first_activity",
      message: "เริ่มสถิติวันนี้เลย! ทำต่อเนื่องไปเรื่อย ๆ นะ",
    };
  }

  if (activityDay === state.lastActiveDate) {
    return { ...state, outcome: "same_day_noop", message: "" };
  }

  // Whether a shield is available to cover THIS gap is decided using the shield
  // count as it stood before any new-week refill — a fresh week's shield must not
  // retroactively bail out a gap that started in the previous week. The refill
  // itself (for future use in the new week) is applied to the outgoing state
  // regardless of how this gap was resolved.
  const crossedIntoNewWeek = weekKeyOf(activityDay) !== weekKeyOf(state.lastActiveDate);
  const shieldsAvailableForThisGap = state.shieldsLeft;
  const finalShieldsLeft = (consumed: boolean) => {
    if (crossedIntoNewWeek) return 1; // fresh week, fresh shield
    return consumed ? shieldsAvailableForThisGap - 1 : shieldsAvailableForThisGap;
  };

  const gap = workingDaysBetweenExclusive(state.lastActiveDate, activityDay);

  if (gap === 0) {
    const streak = state.streak + 1;
    return {
      streak,
      bestStreak: Math.max(state.bestStreak, streak),
      shieldsLeft: finalShieldsLeft(false),
      lastActiveDate: activityDay,
      outcome: "continued",
      message: "ต่อเนื่องอีกวัน! เยี่ยมมาก",
    };
  }

  if (gap === 1 && shieldsAvailableForThisGap > 0) {
    const streak = state.streak + 1;
    return {
      streak,
      bestStreak: Math.max(state.bestStreak, streak),
      shieldsLeft: finalShieldsLeft(true),
      lastActiveDate: activityDay,
      outcome: "shield_used",
      message: "Streak Shield ช่วยไว้ทัน! สถิติของคุณยังต่อเนื่องอยู่",
    };
  }

  return {
    streak: 1,
    bestStreak: state.bestStreak,
    shieldsLeft: finalShieldsLeft(false),
    lastActiveDate: activityDay,
    outcome: "reset",
    message: `เริ่มใหม่วันนี้ได้เลย สถิติสูงสุดของคุณคือ ${state.bestStreak} วัน`,
  };
}

/** Full recompute from an ordered (or unordered) list of activity days — must match
 * whatever `advanceStreak` would have produced if called incrementally in order. */
export function replayStreak(activityDaysBangkok: string[]): StreakState {
  const sorted = Array.from(new Set(activityDaysBangkok)).sort();
  return sorted.reduce<StreakState>((state, day) => {
    const r = advanceStreak(state, day);
    return { streak: r.streak, bestStreak: r.bestStreak, shieldsLeft: r.shieldsLeft, lastActiveDate: r.lastActiveDate };
  }, INITIAL_STREAK_STATE);
}

/**
 * The Weekly Review streak (§3.5: "Weekly Review Streak แยกต่างหาก") — tracked
 * independently of the daily streak, gapped by week rather than by working day.
 */
export function advanceWeeklyReviewStreak(state: StreakState, activityWeekKey: string): AdvanceStreakResult {
  if (!state.lastActiveDate) {
    return { ...state, streak: 1, bestStreak: Math.max(state.bestStreak, 1), lastActiveDate: activityWeekKey, outcome: "first_activity", message: "ส่ง Weekly Review ครั้งแรก เริ่มสถิติเลย!" };
  }
  if (activityWeekKey === state.lastActiveDate) {
    return { ...state, outcome: "same_day_noop", message: "" };
  }
  const gapWeeks = weekKeyDistance(state.lastActiveDate, activityWeekKey);
  if (gapWeeks === 1) {
    const streak = state.streak + 1;
    return { streak, bestStreak: Math.max(state.bestStreak, streak), shieldsLeft: state.shieldsLeft, lastActiveDate: activityWeekKey, outcome: "continued", message: "ส่ง Weekly Review ต่อเนื่องอีกสัปดาห์!" };
  }
  return { streak: 1, bestStreak: state.bestStreak, shieldsLeft: state.shieldsLeft, lastActiveDate: activityWeekKey, outcome: "reset", message: `พลาดไปสัปดาห์นี้ ไม่เป็นไร เริ่มใหม่ได้เลย สถิติสูงสุดคือ ${state.bestStreak} สัปดาห์` };
}

/** Distance in whole weeks between two 'W{monday-iso}' week keys produced by getBangkokWeekKey. */
function weekKeyDistance(a: string, b: string): number {
  const da = toDate(a.slice(1));
  const db = toDate(b.slice(1));
  return Math.round((db.getTime() - da.getTime()) / (7 * 86_400_000));
}

export function replayWeeklyReviewStreak(weekKeys: string[]): StreakState {
  const sorted = Array.from(new Set(weekKeys)).sort();
  return sorted.reduce<StreakState>((state, wk) => {
    const r = advanceWeeklyReviewStreak(state, wk);
    return { streak: r.streak, bestStreak: r.bestStreak, shieldsLeft: r.shieldsLeft, lastActiveDate: r.lastActiveDate };
  }, INITIAL_STREAK_STATE);
}
