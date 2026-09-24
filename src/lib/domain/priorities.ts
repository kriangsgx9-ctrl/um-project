// Ported from prototype lines 896-915 (todayItems/weeklyPriorities) — the basis for
// V2's Daily Missions generator (see PRIME_UM_ASCEND_V2_GAME_MODE.md §3.1).
import { DONE, curPhase, dueDate, isOverdue, isUMReady, phaseById, ua } from "./actions";
import { actionsFor } from "./actions";
import { diffDays, fmtMoney, lastMonths, pct, today } from "./dates";
import { gateRequirements } from "./gate";
import { kpiTarget, kpiVal } from "./kpi";
import type { Store, UserRecord } from "./types";

const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export interface TodayItem {
  kind: "action" | "coaching" | "candidate";
  cat: string;
  title: string;
  due: string | null;
  status: string;
  prio: number;
  overdue: boolean;
  link: string;
  cta: string;
}

export function todayItems(store: Store, u: UserRecord): TodayItem[] {
  const items: TodayItem[] = [];
  const T = today();

  actionsFor(store, u.id)
    .filter((a) => {
      const s = ua(store, u.id, a.id).status;
      if (DONE.has(s) || s === "waiting_review") return false;
      const p = phaseById(store, a.phaseId);
      return !!p && (p.no === u.currentPhase || isOverdue(store, u, a) || !!a.assignedTo);
    })
    .forEach((a) => {
      const d = dueDate(u, a);
      items.push({
        kind: "action",
        cat: a.category,
        title: a.title,
        due: d,
        status: ua(store, u.id, a.id).status,
        prio: PRIORITY_ORDER[a.priority] ?? 2,
        overdue: isOverdue(store, u, a),
        link: "#/actions/" + a.id,
        cta: ua(store, u.id, a.id).status === "not_started" ? "Start Action" : "ทำต่อ",
      });
    });

  store.coaching
    .filter(
      (c) =>
        c.userId === u.id &&
        c.status === "scheduled" &&
        diffDays(c.date, T) <= 1 &&
        diffDays(c.date, T) >= -1
    )
    .forEach((c) =>
      items.push({
        kind: "coaching",
        cat: "Coaching",
        title: "Coaching Session: " + c.topic,
        due: c.date,
        status: "scheduled",
        prio: 0,
        overdue: false,
        link: "#/development",
        cta: "ดูรายละเอียด",
      })
    );

  store.candidates
    .filter((c) => c.ownerId === u.id && c.status === "active" && c.nextActionDate && diffDays(c.nextActionDate, T) <= 0)
    .forEach((c) =>
      items.push({
        kind: "candidate",
        cat: "Recruitment",
        title: (c.nextAction || "ติดตามผู้สมัคร") + " — " + c.name,
        due: c.nextActionDate,
        status: "candidate",
        prio: 1,
        overdue: diffDays(c.nextActionDate as string, T) < 0,
        link: "#/recruitment?c=" + c.id,
        cta: "บันทึกผล",
      })
    );

  return items.sort(
    (a, b) =>
      (Number(b.overdue) - Number(a.overdue)) ||
      (a.due || "").localeCompare(b.due || "") ||
      a.prio - b.prio
  );
}

export interface WeeklyPriority {
  ic: string;
  t: string;
  s: string;
  link: string;
  src: string;
}

export function weeklyPriorities(store: Store, u: UserRecord): WeeklyPriority[] {
  const out: WeeklyPriority[] = [];

  const overdue = actionsFor(store, u.id).filter((a) => a.required && isOverdue(store, u, a));
  if (overdue.length)
    out.push({
      ic: "alert",
      t: `เคลียร์งานค้าง ${overdue.length} รายการ`,
      s: `เริ่มจาก "${overdue[0].title}"`,
      link: "#/actions/" + overdue[0].id,
      src: "Incomplete actions",
    });

  const p = curPhase(store, u);
  if (p && !isUMReady(store, u)) {
    const miss = gateRequirements(store, u, p).filter((r) => !r.ok);
    if (miss.length)
      out.push({
        ic: "flag",
        t: `เตรียม ${p.gate.name}: เหลือ ${miss.length} ข้อ`,
        s: miss.slice(0, 2).map((r) => r.title).join(", "),
        link: "#/journey/" + p.id,
        src: "Upcoming gate",
      });
  }

  const mk = lastMonths(1)[0];
  const f = kpiVal(store, u.id, mk, "fyp");
  const t = kpiTarget(store, u.id, mk, "fyp");
  const expected = t * Math.min(1, today().getUTCDate() / 30);
  if (t && f < expected * 0.9)
    out.push({
      ic: "chart",
      t: "ปิด gap FYP เดือนนี้",
      s: `ทำได้ ${fmtMoney(f)} จากเป้า ${fmtMoney(t)} (${pct(f, t)}%)`,
      link: "#/performance",
      src: "KPI gap",
    });

  const cp = store.coaching
    .filter(
      (c) =>
        c.userId === u.id &&
        c.kind === "received" &&
        c.status === "completed" &&
        c.actionPlan &&
        c.followUpDate &&
        diffDays(c.followUpDate, today()) >= -3
    )
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  if (cp) out.push({ ic: "coach", t: "ทำตามข้อตกลงกับโค้ช", s: cp.actionPlan, link: "#/development", src: "Coach recommendation" });

  if (p && !isUMReady(store, u) && out.length < 3) {
    const next = actionsFor(store, u.id, p.id)
      .filter((a) => {
        const s = ua(store, u.id, a.id).status;
        return !DONE.has(s) && s !== "waiting_review";
      })
      .sort((a, b) => a.dueOffset - b.dueOffset)[0];
    if (next) out.push({ ic: "actions", t: "ขยับ Phase " + p.key, s: next.title, link: "#/actions/" + next.id, src: "Current phase" });
  }

  return out.slice(0, 3);
}
