// Ported from prototype lines 825-831 (gateRequirements/gateReview/gateStatus).
import { DONE, actionsFor, phaseState, ua } from "./actions";
import { funnelMetric } from "./funnel";
import type { Phase, Store, UserRecord } from "./types";

export interface GateRequirementResult {
  id: string;
  type: "action" | "metric";
  title: string;
  ok: boolean;
  status?: string;
  value?: number;
  min?: number;
  actionId?: string;
}

export function gateRequirements(store: Store, u: UserRecord, p: Phase): GateRequirementResult[] {
  const reqs: GateRequirementResult[] = actionsFor(store, u.id, p.id)
    .filter((a) => a.required)
    .map((a) => ({
      id: a.id,
      type: "action" as const,
      title: a.title,
      ok: DONE.has(ua(store, u.id, a.id).status),
      status: ua(store, u.id, a.id).status,
      actionId: a.id,
    }));
  (p.gate.metrics || []).forEach((m) => {
    const v = funnelMetric(store, u.id, m.metric);
    reqs.push({ id: m.id, type: "metric", title: m.title, ok: v >= m.min, value: v, min: m.min });
  });
  return reqs;
}

export function gateReview(store: Store, uid: string, phaseId: string) {
  return (
    store.gateReviews
      .filter((g) => g.userId === uid && g.phaseId === phaseId)
      .sort((a, b) => (b.requestedAt || "").localeCompare(a.requestedAt || ""))[0] || null
  );
}

export interface GateStatusResult {
  k: "passed" | "requested" | "needs_dev" | "ready" | "open" | "locked";
  l: string;
}

export function gateStatus(store: Store, u: UserRecord, p: Phase): GateStatusResult {
  const st = phaseState(u, p);
  if (st === "done") return { k: "passed", l: "ผ่าน Gate แล้ว" };
  const g = gateReview(store, u.id, p.id);
  if (g && g.status === "requested") return { k: "requested", l: "รอ AL รีวิว Gate" };
  if (g && g.status === "needs_dev") return { k: "needs_dev", l: "ต้องพัฒนาเพิ่มก่อนผ่าน Gate" };
  if (st === "current") {
    const r = gateRequirements(store, u, p);
    return r.every((x) => x.ok)
      ? { k: "ready", l: "พร้อมขอรีวิว Gate" }
      : { k: "open", l: `ครบ ${r.filter((x) => x.ok).length}/${r.length} ข้อ` };
  }
  return { k: "locked", l: "ยังไม่เปิด" };
}
