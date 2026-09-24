// Daily Missions generator (V2 spec §3.1): breaks todayItems()/weeklyPriorities()
// into up to 3 small, same-day-completable missions. "kind" values match the
// DailyMission.kind comment in prisma/schema.prisma and are also this generator's
// de-dupe key (one row per kind per user per day, via a DB unique constraint) —
// so there are at most 4 possible missions/day, of which up to 3 are picked.
import { todayItems, weeklyPriorities } from "./priorities";
import type { Store, UserRecord } from "./types";

export type DailyMissionKind = "call_candidates" | "quest_step" | "log_kpi" | "read_feedback";

export interface DailyMissionCandidate {
  kind: DailyMissionKind;
  title: string;
  target: number;
  link: string;
}

export function generateDailyMissionCandidates(store: Store, user: UserRecord): DailyMissionCandidate[] {
  const today = todayItems(store, user);
  const weekly = weeklyPriorities(store, user);
  const out: DailyMissionCandidate[] = [];

  // Links point at the top-level page for each area (/recruitment, /actions, ...),
  // not a per-record detail route — those detail pages (e.g. /actions/[id]) are
  // Action Center work (v1 §10-11), not yet built in this sprint.
  const candidateItems = today.filter((i) => i.kind === "candidate");
  if (candidateItems.length > 0) {
    const n = Math.min(2, candidateItems.length);
    out.push({ kind: "call_candidates", title: `โทรหาผู้สมัคร ${n} คน`, target: n, link: "/recruitment" });
  }

  const questItem = today.find((i) => i.kind === "action" && !i.overdue);
  if (questItem) {
    out.push({ kind: "quest_step", title: `ทำ Main Quest ต่ออีก 1 ขั้น: ${questItem.title}`, target: 1, link: "/actions" });
  }

  const kpiPriority = weekly.find((w) => w.ic === "chart");
  if (kpiPriority) {
    out.push({ kind: "log_kpi", title: "บันทึก KPI สัปดาห์นี้", target: 1, link: "/performance" });
  }

  const coachPriority = weekly.find((w) => w.ic === "coach");
  if (coachPriority) {
    out.push({ kind: "read_feedback", title: "อ่าน feedback โค้ชและกดรับทราบ", target: 1, link: "/development" });
  }

  return out;
}

/**
 * Excludes a kind that already ran on BOTH of the last 2 days (would become a 3rd
 * consecutive day) per spec §3.1 ("ไม่ซ้ำเกิน 2 วันติด"), then returns up to 3.
 * `recentKinds` is ordered most-recent-day-first, e.g. [yesterday, dayBefore].
 */
export function pickDailyMissions(candidates: DailyMissionCandidate[], recentKinds: DailyMissionKind[][]): DailyMissionCandidate[] {
  const [yesterday, dayBefore] = recentKinds;
  const usedBothDays = new Set((yesterday ?? []).filter((k) => (dayBefore ?? []).includes(k)));
  return candidates.filter((c) => !usedBothDays.has(c.kind)).slice(0, 3);
}
