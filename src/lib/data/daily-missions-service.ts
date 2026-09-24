// Service layer wiring the pure lib/domain/daily-missions generator to Prisma
// persistence and the lib/game XP engine. Kept out of "use server" action files
// so it can be called both from the dashboard Server Component (to ensure
// today's missions exist before rendering) and from a Server Action (to
// complete one) without duplicating logic.
import type { DailyMission, PrismaClient } from "@prisma/client";
import { addDays, today } from "@/lib/domain/dates";
import { generateDailyMissionCandidates, pickDailyMissions, type DailyMissionKind } from "@/lib/domain/daily-missions";
import { userById } from "@/lib/domain/actions";
import { resolveXpAmount } from "@/lib/game/xp-table";
import { getGameSettings } from "@/lib/game/settings";
import { awardXp } from "@/lib/game/xp-engine";
import { toBangkokDateString } from "@/lib/game/clock";
import type { Store } from "@/lib/domain/types";

/** Idempotent: generates today's missions if they don't already exist, then returns them. */
export async function ensureTodaysMissions(prisma: PrismaClient, store: Store, userId: string): Promise<DailyMission[]> {
  const user = userById(store, userId);
  if (!user) throw new Error(`user ${userId} not found in store`);

  const todayDate = today();
  const existing = await prisma.dailyMission.findMany({ where: { userId, date: todayDate } });
  if (existing.length > 0) return existing.sort((a, b) => a.kind.localeCompare(b.kind));

  const [yesterday, dayBefore] = await Promise.all([
    prisma.dailyMission.findMany({ where: { userId, date: addDays(todayDate, -1) }, select: { kind: true } }),
    prisma.dailyMission.findMany({ where: { userId, date: addDays(todayDate, -2) }, select: { kind: true } }),
  ]);
  const recentKinds: DailyMissionKind[][] = [
    yesterday.map((m) => m.kind as DailyMissionKind),
    dayBefore.map((m) => m.kind as DailyMissionKind),
  ];

  const candidates = generateDailyMissionCandidates(store, user);
  const picked = pickDailyMissions(candidates, recentKinds);
  if (picked.length === 0) return [];

  const settings = await getGameSettings(prisma);
  await prisma.dailyMission.createMany({
    data: picked.map((c) => ({
      userId,
      date: todayDate,
      kind: c.kind,
      title: c.title,
      target: c.target,
      xp: resolveXpAmount("daily_mission_done", settings.xpTable),
      link: c.link,
    })),
    skipDuplicates: true,
  });

  return prisma.dailyMission.findMany({ where: { userId, date: todayDate } });
}

export interface CompleteMissionResult {
  mission: DailyMission;
  xpAwarded: number;
  bonusAwarded: number;
}

export async function completeDailyMission(prisma: PrismaClient, userId: string, missionId: string): Promise<CompleteMissionResult> {
  const mission = await prisma.dailyMission.findUniqueOrThrow({ where: { id: missionId } });
  if (mission.userId !== userId) throw new Error("not your mission");

  const now = new Date();
  if (!mission.doneAt) {
    await prisma.dailyMission.update({ where: { id: missionId }, data: { doneAt: now, progress: mission.target } });
  }

  const award = await awardXp(prisma, {
    userId,
    type: "daily_mission_done",
    sourceType: "mission",
    sourceId: mission.id,
    occurredAt: now,
  });

  let bonusAwarded = 0;
  const allToday = await prisma.dailyMission.findMany({ where: { userId, date: mission.date } });
  const allDone = allToday.length > 0 && allToday.every((m) => m.doneAt);
  if (allDone) {
    const bangkokDay = toBangkokDateString(mission.date);
    const bonus = await awardXp(prisma, {
      userId,
      type: "daily_mission_all3_bonus",
      sourceType: "mission",
      sourceId: `${userId}:${bangkokDay}`,
      occurredAt: now,
    });
    bonusAwarded = bonus.amount;
  }

  return { mission: { ...mission, doneAt: mission.doneAt ?? now, progress: mission.target }, xpAwarded: award.amount, bonusAwarded };
}
