// Shared types for the game engine service layer (lib/game/*).
// See PRIME_UM_ASCEND_V2_GAME_MODE.md §3.2-3.6 and §8 for the spec these implement.

export type XpSourceType = "action" | "evidence" | "candidate" | "coaching" | "weekly" | "gate" | "kudos" | "mission";

export type XpEventType =
  | "daily_mission_done"
  | "daily_mission_all3_bonus"
  | "quest_started"
  | "evidence_submitted"
  | "evidence_verified"
  | "quest_no_evidence_completed"
  | "kpi_logged"
  | "funnel_stage_move"
  | "weekly_review_submitted"
  | "coaching_received"
  | "team_coaching_logged"
  | "gate_won"
  | "kudos_received"
  | "reversal";

export interface AwardXpContext {
  /** Required for 'funnel_stage_move': which funnel stage index was just reached. */
  stage?: number;
  [key: string]: unknown;
}

export interface AwardXpInput {
  userId: string;
  type: XpEventType;
  sourceType: XpSourceType;
  sourceId: string;
  context?: AwardXpContext;
  /** Defaults to now(); lets callers backdate for imports/tests/replays. */
  occurredAt?: Date;
}

export interface XpEventRow {
  id: string;
  userId: string;
  type: string;
  amount: number;
  sourceType: string;
  sourceId: string;
  reason: string | null;
  createdAt: Date;
}

export interface UserProgressRow {
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
}

export type SkippedReason = "duplicate" | "cap_exceeded";

export interface AwardXpResult {
  awarded: boolean;
  amount: number;
  xpEvent?: XpEventRow;
  progress: UserProgressRow;
  skippedReason?: SkippedReason;
}

export interface ReverseXpInput {
  userId: string;
  /** The type of the ORIGINAL event being undone. */
  type: XpEventType;
  sourceType: XpSourceType;
  /** Must exactly match the original event's sourceId. */
  sourceId: string;
  reason: string;
  occurredAt?: Date;
}

export interface ReverseXpResult {
  reversed: boolean;
  amount: number;
  xpEvent?: XpEventRow;
  progress: UserProgressRow;
  skippedReason?: "no_matching_award" | "already_reversed";
}
