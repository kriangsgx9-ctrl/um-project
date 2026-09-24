// Weekly-effort leaderboard (V2 §3.9): ranks by XP earned THIS Bangkok week
// (not lifetime XP, not sales/readiness), resets every Monday for free, and
// never exposes the bottom of the list — only top 5 + the caller's own rank.
import type { PrismaClient } from "@prisma/client";
import { bangkokWeekRangeUtc, getBangkokWeekKey } from "@/lib/game/clock";
import { getGameSettings } from "@/lib/game/settings";

export interface LeaderboardEntry {
  userId: string;
  name: string;
  weeklyXp: number;
  rank: number;
}

export interface Leaderboard {
  enabled: boolean;
  top: LeaderboardEntry[];
  self: LeaderboardEntry | null;
}

export async function getWeeklyLeaderboard(prisma: PrismaClient, cohortId: string, selfUserId: string): Promise<Leaderboard> {
  const settings = await getGameSettings(prisma);
  if (!settings.leaderboardOn) return { enabled: false, top: [], self: null };

  const { start, end } = bangkokWeekRangeUtc(getBangkokWeekKey(new Date()));
  const cohortUsers = await prisma.user.findMany({ where: { cohortId }, select: { id: true, name: true } });
  const userIds = cohortUsers.map((u) => u.id);

  const grouped = await prisma.xpEvent.groupBy({
    by: ["userId"],
    where: { userId: { in: userIds }, createdAt: { gte: start, lt: end } },
    _sum: { amount: true },
  });
  const xpByUser = new Map(grouped.map((g) => [g.userId, g._sum.amount ?? 0]));

  const ranked: LeaderboardEntry[] = cohortUsers
    .map((u) => ({ userId: u.id, name: u.name, weeklyXp: xpByUser.get(u.id) ?? 0 }))
    .sort((a, b) => b.weeklyXp - a.weeklyXp)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  const self = ranked.find((e) => e.userId === selfUserId) ?? null;
  return { enabled: true, top: ranked.slice(0, 5), self };
}
