// Anti-gaming caps per PRIME_UM_ASCEND_V2_GAME_MODE.md §3.3: self-logged repeatable
// activities have daily/weekly caps, admin-configurable via GameSettings.caps.
import type { Prisma, PrismaClient } from "@prisma/client";
import { bangkokDayRangeUtc, bangkokWeekRangeUtc, getBangkokWeekKey, toBangkokDateString } from "./clock";
import type { XpEventType } from "./types";

export type CapPeriod = "day" | "week";
export interface CapRule {
  period: CapPeriod;
  max: number;
}
export type CapsConfig = Partial<Record<XpEventType, CapRule>>;

// Defaults per §3.2 table notes: KPI weekly log max 1x/week, team/1-on-1 coaching max 5x/week.
export const DEFAULT_CAPS: CapsConfig = {
  kpi_logged: { period: "week", max: 1 },
  team_coaching_logged: { period: "week", max: 5 },
};

type Db = PrismaClient | Prisma.TransactionClient;

export async function countEventsInPeriod(
  db: Db,
  userId: string,
  type: XpEventType,
  period: CapPeriod,
  referenceInstant: Date
): Promise<number> {
  const { start, end } =
    period === "day"
      ? bangkokDayRangeUtc(toBangkokDateString(referenceInstant))
      : bangkokWeekRangeUtc(getBangkokWeekKey(referenceInstant));
  return db.xpEvent.count({ where: { userId, type, createdAt: { gte: start, lt: end } } });
}

export async function isWithinCap(
  db: Db,
  userId: string,
  type: XpEventType,
  rule: CapRule,
  referenceInstant: Date
): Promise<{ allowed: boolean; current: number; max: number }> {
  const current = await countEventsInPeriod(db, userId, type, rule.period, referenceInstant);
  return { allowed: current < rule.max, current, max: rule.max };
}
