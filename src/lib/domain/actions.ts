// Ported from prototype lines 807-819 (actionsFor/ua/dueDate/isOverdue/phase state
// & progress helpers). DONE mirrors the prototype's `DONE` set.
import { addDays, diffDays, iso, pct, today } from "./dates";
import type { ActionDef, ActionStatus, Phase, Store, UserActionRecord, UserRecord } from "./types";

export const DONE = new Set<ActionStatus>(["verified", "completed"]);

export function userById(store: Store, uid: string): UserRecord | undefined {
  return store.users.find((u) => u.id === uid);
}

export function phaseById(store: Store, id: string): Phase | undefined {
  return store.phases.find((p) => p.id === id);
}

export function phaseByNo(store: Store, no: number): Phase | undefined {
  return store.phases.find((p) => p.no === no);
}

/** Actions visible to a user: phase templates plus any one-off Coach Quest assigned to them. */
export function actionsFor(store: Store, uid: string, phaseId?: string): ActionDef[] {
  return store.actions.filter(
    (a) => (!a.assignedTo || a.assignedTo === uid) && (!phaseId || a.phaseId === phaseId)
  );
}

const emptyUserAction = (userId: string, actionId: string): UserActionRecord => ({
  userId,
  actionId,
  status: "not_started",
  startedAt: null,
  completedAt: null,
  notes: "",
  history: [],
});

export function ua(store: Store, uid: string, aid: string): UserActionRecord {
  return store.userActions.find((x) => x.userId === uid && x.actionId === aid) ?? emptyUserAction(uid, aid);
}

export function dueDate(u: UserRecord, a: ActionDef): string {
  return iso(addDays(u.startDate, a.dueOffset - 1));
}

export function isOverdue(store: Store, u: UserRecord, a: ActionDef): boolean {
  const s = ua(store, u.id, a.id).status;
  return !DONE.has(s) && s !== "waiting_review" && diffDays(dueDate(u, a), today()) < 0;
}

export function curPhase(store: Store, u: UserRecord): Phase | undefined {
  return phaseByNo(store, Math.min(u.currentPhase, store.phases.length));
}

export function isUMReady(store: Store, u: UserRecord): boolean {
  return u.currentPhase > store.phases.length;
}

export function phaseState(u: UserRecord, p: Phase): "done" | "current" | "upcoming" {
  if (p.no < u.currentPhase) return "done";
  if (p.no === u.currentPhase) return "current";
  return "upcoming";
}

export function phaseProgress(store: Store, u: UserRecord, p: Phase): number {
  const acts = actionsFor(store, u.id, p.id).filter((a) => a.required || a.assignedTo);
  if (!acts.length) return phaseState(u, p) === "done" ? 100 : 0;
  return pct(acts.filter((a) => DONE.has(ua(store, u.id, a.id).status)).length, acts.length);
}

export function overallProgress(store: Store, u: UserRecord): number {
  const acts = actionsFor(store, u.id).filter((a) => a.required);
  if (!acts.length) return 0;
  return pct(acts.filter((a) => DONE.has(ua(store, u.id, a.id).status)).length, acts.length);
}

export function phaseDates(u: UserRecord, p: Phase): { start: string; end: string } {
  return {
    start: iso(addDays(u.startDate, p.startDay - 1)),
    end: iso(addDays(u.startDate, p.endDay - 1)),
  };
}

export function daysRemainingInPhase(store: Store, u: UserRecord): number {
  const p = curPhase(store, u);
  if (!p || isUMReady(store, u)) return 0;
  return diffDays(phaseDates(u, p).end, today());
}
