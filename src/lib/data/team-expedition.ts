// Team Expedition (V2 §3.9): a monthly cohort-wide quest with a combined
// progress bar; everyone in the cohort gets XP once the shared target is hit.
// Two real, working metrics are wired up ("interview"/"onboard" funnel-stage
// counts) — full admin-configurable metric flexibility (v1 §7) is out of scope.
import type { PrismaClient, TeamChallenge } from "@prisma/client";
import { stageIndex } from "@/lib/domain/funnel";
import { awardXp } from "@/lib/game/xp-engine";

export const TEAM_CHALLENGE_METRICS = ["interview", "onboard"] as const;
export type TeamChallengeMetric = (typeof TEAM_CHALLENGE_METRICS)[number];

export interface TeamExpeditionProgress {
  challenge: TeamChallenge;
  actual: number;
  justCompleted: boolean;
}

export async function getActiveTeamChallenge(prisma: PrismaClient, cohortId: string): Promise<TeamChallenge | null> {
  const now = new Date();
  return prisma.teamChallenge.findFirst({ where: { cohortId, startAt: { lte: now }, endAt: { gte: now } } });
}

/** Computes progress and, if the target is newly reached, pays out XP to every cohort member exactly once. */
export async function checkAndCompleteTeamChallenge(prisma: PrismaClient, challenge: TeamChallenge): Promise<TeamExpeditionProgress> {
  const cohortUsers = await prisma.user.findMany({ where: { cohortId: challenge.cohortId, role: "um" }, select: { id: true } });
  const userIds = cohortUsers.map((u) => u.id);

  const isKnownMetric = (TEAM_CHALLENGE_METRICS as readonly string[]).includes(challenge.metric);
  const actual = isKnownMetric
    ? await prisma.candidate.count({ where: { ownerId: { in: userIds }, stage: { gte: stageIndex(challenge.metric as TeamChallengeMetric) } } })
    : 0; // other metrics aren't wired up yet — documented limitation, not silently wrong (returns 0, never a fake "done")

  let justCompleted = false;
  let resultChallenge = challenge;
  if (actual >= challenge.target && !challenge.completedAt) {
    resultChallenge = await prisma.teamChallenge.update({ where: { id: challenge.id }, data: { completedAt: new Date() } });
    for (const userId of userIds) {
      await awardXp(prisma, {
        userId,
        type: "team_challenge_complete",
        sourceType: "team",
        sourceId: challenge.id,
        context: { amount: challenge.xpReward },
      });
    }
    justCompleted = true;
  }

  return { challenge: resultChallenge, actual, justCompleted };
}
