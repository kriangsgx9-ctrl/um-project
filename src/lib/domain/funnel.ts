import type { CandidateRecord, Store } from "./types";

export const STAGES = [
  { k: "prospect", l: "Prospect", th: "รายชื่อ" },
  { k: "contact", l: "Contact", th: "ติดต่อแล้ว" },
  { k: "interview", l: "Interview", th: "สัมภาษณ์" },
  { k: "presentation", l: "Presentation", th: "นำเสนออาชีพ" },
  { k: "followup", l: "Follow-up", th: "ติดตาม" },
  { k: "commit", l: "Commit", th: "ตกลงเข้าร่วม" },
  { k: "onboard", l: "Onboard", th: "เริ่มงานแล้ว" },
] as const;

export type StageKey = (typeof STAGES)[number]["k"];

export function stageIndex(key: StageKey): number {
  return STAGES.findIndex((s) => s.k === key);
}

function candidatesOf(store: Store, uid: string): CandidateRecord[] {
  return store.candidates.filter((c) => c.ownerId === uid);
}

/** Count of candidates that reached at least stage i, for every stage i. */
export function funnelCounts(store: Store, uid: string): number[] {
  const c = candidatesOf(store, uid);
  return STAGES.map((_, i) => c.filter((x) => x.stage >= i).length);
}

export function funnelMetric(store: Store, uid: string, stageKey: string): number {
  const i = STAGES.findIndex((s) => s.k === stageKey);
  return funnelCounts(store, uid)[i] || 0;
}

/** Ordered stage indices strictly between two stages (exclusive..inclusive), ascending. */
export function stagesBetween(fromStage: number, toStage: number): number[] {
  const out: number[] = [];
  if (toStage > fromStage) {
    for (let i = fromStage + 1; i <= toStage; i++) out.push(i);
  } else {
    for (let i = fromStage; i > toStage; i--) out.push(i);
  }
  return out;
}
