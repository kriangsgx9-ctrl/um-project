// Upserts Badge definition rows (lazy, idempotent) and UserBadge rows for any
// newly-reached tier, using the existing @@unique([userId, badgeId, tier]).
// Called once when /passport loads — see tieredBadges() in lib/domain/badges.ts
// for the pure tier-computation logic this wires up to Prisma.
import type { PrismaClient } from "@prisma/client";
import { TIERED_BADGE_DEFS, tieredBadges, type BadgeTier } from "@/lib/domain/badges";
import type { Store } from "@/lib/domain/types";

const TIER_ORDER: BadgeTier[] = ["bronze", "silver", "gold"];

export async function syncUserBadges(prisma: PrismaClient, store: Store, userId: string, bestStreak: number) {
  const statuses = tieredBadges(store, userId, bestStreak);

  for (const def of TIERED_BADGE_DEFS) {
    await prisma.badge.upsert({
      where: { key: def.k },
      create: { key: def.k, name: def.l, tiers: def.thresholds, icon: "award" },
      update: {},
    });
  }
  const badgeRows = await prisma.badge.findMany({ where: { key: { in: TIERED_BADGE_DEFS.map((d) => d.k) } } });
  const badgeIdByKey = new Map(badgeRows.map((b) => [b.key, b.id]));

  for (const status of statuses) {
    if (!status.tier) continue;
    const badgeId = badgeIdByKey.get(status.k);
    if (!badgeId) continue;
    // Earning gold implies bronze+silver were earned too — record every tier
    // reached so far, not just the current one, for an honest earnedAt history.
    const reachedTiers = TIER_ORDER.slice(0, TIER_ORDER.indexOf(status.tier) + 1);
    for (const tier of reachedTiers) {
      await prisma.userBadge.upsert({
        where: { userId_badgeId_tier: { userId, badgeId, tier } },
        create: { userId, badgeId, tier },
        update: {},
      });
    }
  }

  return statuses;
}
