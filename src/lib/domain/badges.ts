// Ported from prototype lines 917-928 — the v1 base 6 badges (no tiers yet).
// V2 §3.8 extends this into 3-tier Bronze/Silver/Gold badges; that lives in lib/game
// (Sprint E), which will supersede this list but should keep these `k` keys stable.
import { DONE, actionsFor, ua, userById } from "./actions";
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
