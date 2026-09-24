// Ported from prototype lines 870-894 (lastActivity/risks/riskLevel).
import { curPhase, daysRemainingInPhase, isOverdue, isUMReady, userById } from "./actions";
import { actionsFor } from "./actions";
import { diffDays, lastMonths, pct, today } from "./dates";
import { gateRequirements } from "./gate";
import { kpiTarget, kpiVal } from "./kpi";
import type { Store } from "./types";

export type RiskLevel = "green" | "amber" | "red";

export interface RiskSignal {
  lvl: RiskLevel;
  key: string;
  title: string;
  detail: string;
  rec: string;
  cat: string;
}

export function risks(store: Store, uid: string): RiskSignal[] {
  const u = userById(store, uid);
  if (!u || isUMReady(store, u)) return [];

  const out: RiskSignal[] = [];
  const add = (lvl: RiskLevel, key: string, title: string, detail: string, rec: string, cat: string) =>
    out.push({ lvl, key, title, detail, rec, cat });

  const overdue = actionsFor(store, uid).filter((a) => a.required && isOverdue(store, u, a));
  if (overdue.length)
    add(
      overdue.length >= 3 ? "red" : "amber",
      "overdue",
      "Overdue actions",
      `มีงานบังคับเกินกำหนด ${overdue.length} รายการ เช่น "${overdue[0].title}"`,
      "นัดคุยสั้น 15 นาทีเพื่อจัดลำดับและกำหนดวันส่งใหม่",
      "Management"
    );

  const m = lastMonths(2);
  const ach = pct(kpiVal(store, uid, m[0], "fyp"), kpiTarget(store, uid, m[0], "fyp"));
  if (ach < 80)
    add(
      ach < 50 ? "red" : "amber",
      "kpi",
      "Low KPI performance",
      `FYP เดือนนี้ทำได้ ${ach}% ของเป้า`,
      "ทบทวน Activity → Appointment → Case ร่วมกันและตั้งเป้ารายสัปดาห์",
      "Production"
    );

  const cands = store.candidates.filter((c) => c.ownerId === uid);
  const lastRec = cands.map((c) => c.updatedAt).sort().pop();
  const recDays = lastRec ? diffDays(today(), lastRec) : 999;
  if (u.currentPhase >= 3 && recDays > 14)
    add(
      u.currentPhase >= 4 ? "red" : "amber",
      "recruit",
      "Inactive recruitment",
      lastRec ? `ไม่มีความเคลื่อนไหวใน Recruitment ${recDays} วัน` : "ยังไม่มีรายชื่อผู้สมัครในระบบ",
      "มอบหมาย Candidate Mapping 10 รายชื่อภายในสัปดาห์นี้",
      "Recruitment"
    );

  const lastCoach = store.coaching
    .filter((c) => c.userId === uid && c.kind === "received" && c.status === "completed")
    .map((c) => c.date)
    .sort()
    .pop();
  const cDays = lastCoach ? diffDays(today(), lastCoach) : 999;
  if (cDays > 21)
    add(
      cDays > 35 ? "red" : "amber",
      "coaching",
      "Missing coaching",
      lastCoach ? `ไม่มีโค้ชชิ่งมา ${cDays} วัน` : "ยังไม่มีบันทึกโค้ชชิ่ง",
      "นัดโค้ชชิ่ง 1 ครั้งภายใน 7 วัน",
      "Coaching"
    );

  const needEv = actionsFor(store, uid).filter(
    (a) =>
      a.evidence &&
      a.required &&
      isOverdue(store, u, a) &&
      !store.evidence.some((e) => e.userId === uid && e.actionId === a.id && e.status !== "draft")
  );
  if (needEv.length)
    add(
      needEv.length >= 2 ? "red" : "amber",
      "evidence",
      "Missing evidence",
      `ยังไม่ส่งหลักฐาน ${needEv.length} รายการที่เลยกำหนด`,
      "ช่วยเลือกหลักฐานที่ส่งได้ทันทีจากงานที่ทำไปแล้ว",
      "Management"
    );

  const p = curPhase(store, u);
  if (p) {
    const left = daysRemainingInPhase(store, u);
    const reqs = gateRequirements(store, u, p);
    const done = pct(reqs.filter((r) => r.ok).length, reqs.length);
    if (left < 0)
      add(
        "red",
        "gate",
        "Behind gate schedule",
        `${p.gate.name} เลยกำหนด ${-left} วัน (ครบ ${done}%)`,
        "ตกลงแผนปิด Gate ภายใน 14 วันพร้อม checkpoint รายสัปดาห์",
        "Management"
      );
    else if (left <= 10 && done < 70)
      add(
        "amber",
        "gate",
        "Upcoming gate",
        `${p.gate.name} เหลือ ${left} วัน แต่ครบเพียง ${done}%`,
        "เลือก 2 ข้อที่ปิดได้เร็วที่สุดและโฟกัสก่อน",
        "Management"
      );
  }

  const rev = store.evidence.filter(
    (e) => e.userId === uid && e.status === "revision" && diffDays(today(), e.reviewedAt || e.createdAt) <= 30
  ).length;
  if (rev >= 2)
    add(
      "amber",
      "revision",
      "Repeated revision",
      `หลักฐานถูกขอแก้ไข ${rev} ครั้งใน 30 วัน`,
      "อธิบายเกณฑ์หลักฐานที่ดีพร้อมตัวอย่าง",
      "Coaching"
    );

  const lastW = store.weekly
    .filter((w) => w.userId === uid && w.status !== "draft")
    .map((w) => w.weekStart)
    .sort()
    .pop();
  const wDays = lastW ? diffDays(today(), lastW) : 999;
  if (wDays > 14)
    add(
      "amber",
      "engagement",
      "Low engagement",
      lastW ? `ไม่ได้ส่ง Weekly Review มา ${wDays} วัน` : "ยังไม่เคยส่ง Weekly Review",
      "ชวนทำ Weekly Review 10 นาทีทุกวันศุกร์",
      "Management"
    );

  if (u.currentPhase >= 2) {
    const leadHistory = actionsFor(store, uid)
      .filter((a) => a.category === "Leadership")
      .flatMap((a) => {
        const record = store.userActions.find((x) => x.userId === uid && x.actionId === a.id);
        return record ? record.history.map((h) => h.at) : [];
      });
    const teamMeetingDates = store.kpis
      .filter((k) => k.userId === uid && k.metric === "teamMeetings" && k.actual > 0)
      .map((k) => k.period + "-28");
    const lastLead = [...leadHistory, ...teamMeetingDates].sort().pop();
    const lDays = lastLead ? diffDays(today(), lastLead) : 999;
    if (lDays > 14)
      add(
        "amber",
        "leadership",
        "Leadership gap",
        `ไม่มีกิจกรรมด้านภาวะผู้นำใน ${Math.min(lDays, 99)} วันที่ผ่านมา`,
        "มอบหมาย Team Meeting Leadership Mission",
        "Leadership"
      );
  }

  return out.sort((a, b) => (a.lvl === "red" ? 0 : 1) - (b.lvl === "red" ? 0 : 1));
}

export function riskLevel(store: Store, uid: string): RiskLevel {
  const r = risks(store, uid);
  if (r.some((x) => x.lvl === "red")) return "red";
  if (r.length) return "amber";
  return "green";
}
