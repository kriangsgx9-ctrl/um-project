// Ported from prototype lines 917-928 — the v1 base 6 badges (no tiers yet).
// Kept as-is for anything still using the simple ok/not-ok shape.
import { DONE, actionsFor, ua, userById } from "./actions";
import { funnelCounts, stageIndex } from "./funnel";
import type { Store } from "./types";

export interface BadgeStatus {
  k: string;
  l: string;
  ok: boolean;
}

export function badges(store: Store, uid: string): BadgeStatus[] {
  const u = userById(store, uid);
  const doneCat = (c: string) => actionsFor(store, uid).some((a) => a.category === c && DONE.has(ua(store, uid, a.id).status));

  return [
    { k: "lead", l: "First Leadership Mission", ok: doneCat("Leadership") },
    { k: "rec", l: "Recruitment Builder", ok: store.candidates.filter((c) => c.ownerId === uid).length >= 10 },
    {
      k: "coach",
      l: "Coaching Starter",
      ok: store.coaching.some((c) => c.userId === uid && c.kind === "given" && c.status === "completed"),
    },
    { k: "team", l: "Team Leader", ok: !!u && u.currentPhase > 5 },
    { k: "ev", l: "Evidence Champion", ok: store.evidence.filter((e) => e.userId === uid && e.status === "verified").length >= 10 },
    { k: "gate", l: "Gate Completed", ok: store.gateReviews.some((g) => g.userId === uid && g.status === "approved") },
  ];
}

// ---------------------------------------------------------------------------
// Tiered badges (V2 §3.8) — Bronze/Silver/Gold thresholds per the spec table.
// ---------------------------------------------------------------------------

export type BadgeTier = "bronze" | "silver" | "gold";

export interface TieredBadgeDef {
  k: string;
  l: string;
  unit: string; // for the "อีก N {unit} จะได้ {tier}" progress text
  thresholds: Record<BadgeTier, number>;
}

export const TIERED_BADGE_DEFS: TieredBadgeDef[] = [
  { k: "lead", l: "First Leadership Mission", unit: "quest", thresholds: { bronze: 1, silver: 3, gold: 6 } },
  { k: "rec", l: "Recruitment Builder", unit: "คน", thresholds: { bronze: 10, silver: 20, gold: 40 } },
  { k: "interview", l: "Interview Pro", unit: "คน", thresholds: { bronze: 3, silver: 8, gold: 15 } },
  { k: "first_recruit", l: "First Recruit", unit: "คน", thresholds: { bronze: 1, silver: 3, gold: 5 } },
  { k: "coach", l: "Coaching Starter", unit: "ครั้ง", thresholds: { bronze: 1, silver: 10, gold: 25 } },
  { k: "ev", l: "Evidence Champion", unit: "ชิ้น", thresholds: { bronze: 5, silver: 15, gold: 30 } },
  { k: "streak", l: "Streak Keeper", unit: "วัน", thresholds: { bronze: 7, silver: 30, gold: 60 } },
  { k: "reflective", l: "Reflective Leader", unit: "ครั้ง", thresholds: { bronze: 4, silver: 12, gold: 24 } },
  { k: "gate_breaker", l: "Gate Breaker", unit: "Gate", thresholds: { bronze: 1, silver: 3, gold: 6 } },
  { k: "target_hunter", l: "Target Hunter", unit: "เดือน", thresholds: { bronze: 1, silver: 3, gold: 6 } },
];

export interface TieredBadgeStatus {
  k: string;
  l: string;
  unit: string;
  current: number;
  tier: BadgeTier | null;
  nextTier: BadgeTier | null;
  nextThreshold: number | null;
}

function tierFor(current: number, thresholds: Record<BadgeTier, number>): { tier: BadgeTier | null; nextTier: BadgeTier | null; nextThreshold: number | null } {
  if (current >= thresholds.gold) return { tier: "gold", nextTier: null, nextThreshold: null };
  if (current >= thresholds.silver) return { tier: "silver", nextTier: "gold", nextThreshold: thresholds.gold };
  if (current >= thresholds.bronze) return { tier: "bronze", nextTier: "silver", nextThreshold: thresholds.silver };
  return { tier: null, nextTier: "bronze", nextThreshold: thresholds.bronze };
}

function badgeCounts(store: Store, uid: string): Record<string, number> {
  const doneCat = (c: string) => actionsFor(store, uid).filter((a) => a.category === c && DONE.has(ua(store, uid, a.id).status)).length;
  const funnel = funnelCounts(store, uid);
  return {
    lead: doneCat("Leadership"),
    rec: store.candidates.filter((c) => c.ownerId === uid).length,
    interview: funnel[stageIndex("interview")] ?? 0,
    first_recruit: funnel[stageIndex("onboard")] ?? 0,
    coach: store.coaching.filter((c) => c.userId === uid && c.kind === "given" && c.status === "completed").length,
    ev: store.evidence.filter((e) => e.userId === uid && e.status === "verified").length,
    reflective: store.weekly.filter((w) => w.userId === uid && w.status !== "draft").length,
    gate_breaker: store.gateReviews.filter((g) => g.userId === uid && g.status === "approved").length,
    target_hunter: new Set(
      store.kpis.filter((k) => k.userId === uid && k.metric === "fyp" && k.target > 0 && k.actual >= k.target).map((k) => k.period)
    ).size,
  };
}

/** `bestStreak` comes from UserProgress (game engine data) — this function stays DB-free like the rest of lib/domain. */
export function tieredBadges(store: Store, uid: string, bestStreak: number): TieredBadgeStatus[] {
  const counts: Record<string, number> = { ...badgeCounts(store, uid), streak: bestStreak };
  return TIERED_BADGE_DEFS.map((def) => {
    const current = counts[def.k] ?? 0;
    const { tier, nextTier, nextThreshold } = tierFor(current, def.thresholds);
    return { k: def.k, l: def.l, unit: def.unit, current, tier, nextTier, nextThreshold };
  });
}
