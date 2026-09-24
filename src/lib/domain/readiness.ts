// Ported from prototype lines 844-868 (readiness/readinessBand/catActionScore).
// Weights and formula kept byte-identical to the validated prototype.
import { DONE, actionsFor, ua, userById } from "./actions";
import { addDays, avg, clamp, diffDays, iso, lastMonths, sum, today } from "./dates";
import { funnelCounts } from "./funnel";
import { compCatAvg } from "./competency";
import { kpiAch, kpiVal } from "./kpi";
import type { Store } from "./types";

export const DIMS = [
  { k: "production", l: "Personal Production", th: "ผลงานส่วนตัว" },
  { k: "recruitment", l: "Recruitment", th: "การสรรหา" },
  { k: "development", l: "Team Development", th: "พัฒนาทีม" },
  { k: "leadership", l: "Leadership", th: "ภาวะผู้นำ" },
  { k: "management", l: "Management", th: "การบริหาร" },
] as const;

export function catActionScore(store: Store, uid: string, cats: string[]): number {
  const acts = actionsFor(store, uid).filter((a) => cats.includes(a.category) && !a.assignedTo);
  if (!acts.length) return 0;
  return acts.filter((a) => DONE.has(ua(store, uid, a.id).status)).length / acts.length;
}

export interface Readiness {
  total: number;
  dims: Record<string, number>;
}

export function readiness(store: Store, uid: string): Readiness {
  const u = userById(store, uid);
  if (!u) return { total: 0, dims: {} };

  const m3 = lastMonths(3);
  const st = store.settings;
  const comp = (cat: string) => compCatAvg(store, uid, cat) / 5;

  const funnel = funnelCounts(store, uid);
  const rt = st.recruitTargets;
  const fScore = avg(
    ([
      ["contact", 1],
      ["interview", 2],
      ["presentation", 3],
      ["onboard", 6],
    ] as [string, number][]).map(([k, i]) => Math.min(1, funnel[i] / (rt[k] || 1)))
  );

  const since = iso(addDays(today(), -90));
  const given = store.coaching.filter(
    (c) => c.userId === uid && c.kind === "given" && c.status === "completed" && c.date >= since
  ).length;
  const oneOnOne = sum(m3.map((m) => kpiVal(store, uid, m, "oneOnOne")));
  const devAct = Math.min(1, (given + oneOnOne) / (st.coachingTarget || 6));

  const recentW = store.weekly.filter(
    (w) => w.userId === uid && w.status !== "draft" && diffDays(today(), w.weekStart) <= 35
  ).length;

  const dims: Record<string, number> = {
    production:
      0.5 * (kpiAch(store, uid, "fyp", m3) * 0.5 + kpiAch(store, uid, "cases", m3) * 0.25 + kpiAch(store, uid, "activity", m3) * 0.25) +
      0.15 * catActionScore(store, uid, ["Production"]) +
      0.35 * comp("production"),
    recruitment: 0.45 * fScore + 0.2 * catActionScore(store, uid, ["Recruitment"]) + 0.35 * comp("recruitment"),
    development:
      0.35 * devAct + 0.25 * catActionScore(store, uid, ["Coaching", "Development"]) + 0.4 * comp("development"),
    leadership:
      0.3 * catActionScore(store, uid, ["Leadership", "Vision"]) +
      0.3 * kpiAch(store, uid, "teamMeetings", m3) +
      0.4 * comp("leadership"),
    management: 0.3 * catActionScore(store, uid, ["Management"]) + 0.3 * Math.min(1, recentW / 4) + 0.4 * comp("management"),
  };
  Object.keys(dims).forEach((k) => (dims[k] = Math.round(clamp(dims[k] * 100))));

  const w = st.weights as unknown as Record<string, number>;
  const tw = sum(Object.values(w)) || 1;
  const total = Math.round(sum(DIMS.map((d) => dims[d.k] * (w[d.k] || 0))) / tw);
  return { total, dims };
}

export function readinessBand(store: Store, v: number): { l: string; th: string } {
  const t = store.settings.readyThreshold;
  if (v >= t) return { l: "Ready", th: "พร้อม" };
  if (v >= t - 25) return { l: "Developing", th: "กำลังพัฒนา" };
  return { l: "Early stage", th: "เริ่มต้น" };
}
