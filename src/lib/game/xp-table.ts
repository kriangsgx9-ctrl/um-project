// XP Table defaults per PRIME_UM_ASCEND_V2_GAME_MODE.md §3.2. Admin-editable via
// GameSettings.xpTable (see settings.ts) — these are only the shipped defaults.
import type { AwardXpContext, XpEventType } from "./types";

export type XpTable = Record<XpEventType, number>;

/** Funnel stage index (from lib/domain/funnel STAGES) -> XP for reaching that stage. */
export const FUNNEL_STAGE_XP: Record<number, number> = {
  1: 10, // Contact
  2: 25, // Interview
  3: 35, // Presentation
  5: 50, // Commit
  6: 60, // Onboard
};

export const DEFAULT_XP_TABLE: XpTable = {
  daily_mission_done: 10,
  daily_mission_all3_bonus: 20,
  quest_started: 5,
  evidence_submitted: 20,
  evidence_verified: 80,
  quest_no_evidence_completed: 40,
  kpi_logged: 15,
  funnel_stage_move: 0, // resolved per-stage via FUNNEL_STAGE_XP, see resolveXpAmount
  weekly_review_submitted: 30,
  coaching_received: 30,
  team_coaching_logged: 25,
  gate_won: 500,
  kudos_received: 15,
  reversal: 0, // reversal amount is always -(the original event's amount), never looked up here
};

export class UnknownXpEventTypeError extends Error {
  constructor(type: string) {
    super(`Unknown XpEventType: ${type}`);
    this.name = "UnknownXpEventTypeError";
  }
}

export function resolveXpAmount(type: XpEventType, table: XpTable, context?: AwardXpContext): number {
  if (!(type in table)) throw new UnknownXpEventTypeError(type);
  if (type === "funnel_stage_move") {
    const stage = context?.stage;
    if (typeof stage !== "number") throw new Error("funnel_stage_move requires context.stage");
    return FUNNEL_STAGE_XP[stage] ?? 0;
  }
  return table[type];
}
