// Ported from prototype lines 840-841.
import { avg } from "./dates";
import type { Store } from "./types";

export function latestScore(store: Store, uid: string, cid: string) {
  return (
    store.assessments
      .filter((x) => x.userId === uid && x.competencyId === cid)
      .sort((x, y) => y.assessedAt.localeCompare(x.assessedAt))[0] || null
  );
}

export function compCatAvg(store: Store, uid: string, cat: string): number {
  const cs = store.competencies.filter((c) => c.category === cat);
  if (!cs.length) return 0;
  return avg(cs.map((c) => latestScore(store, uid, c.id)?.score ?? 0));
}
