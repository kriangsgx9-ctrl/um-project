// Ported from prototype lines 834-837.
import { sum } from "./dates";
import type { Store } from "./types";

export function kpiRec(store: Store, uid: string, period: string, metric: string) {
  return store.kpis.find((k) => k.userId === uid && k.period === period && k.metric === metric);
}

export function kpiVal(store: Store, uid: string, period: string, metric: string): number {
  return kpiRec(store, uid, period, metric)?.actual ?? 0;
}

export function kpiTarget(store: Store, uid: string, period: string, metric: string): number {
  const r = kpiRec(store, uid, period, metric);
  return r ? r.target : store.settings.kpiTargets[metric] || 0;
}

export function kpiAch(store: Store, uid: string, metric: string, months: string[]): number {
  const t = sum(months.map((m) => kpiTarget(store, uid, m, metric)));
  const a = sum(months.map((m) => kpiVal(store, uid, m, metric)));
  return t > 0 ? Math.min(1, a / t) : 0;
}
