// Ported from prototype/prime-um-ascend.html `seed()` (lines 671-752).
// Produces a fully-populated `Store` for the 6 demo accounts (Future UM 01-03,
// Coach 01, AL 01, Admin 01) with realistic history across phases, KPIs,
// candidates, coaching, weekly reviews, assessments and gate reviews.
//
// Intentionally dropped vs. the prototype (UI/demo-only, not consumed by any
// ported domain function): notifications, evidence file attachments (demoImage),
// mini-teams. The client-side demo login/localStorage mechanism itself is also
// excluded per V2 spec §12 ("ห้ามย้ายส่วนนี้") — auth is real, server-side (see lib/auth.ts).
import { defaultActions, defaultCompetencies, defaultPhases, defaultSettings } from "./program-data";
import { addDays, iso, lastMonths, today, weekStart } from "./dates";
import { DONE } from "./actions";
import type {
  ActionStatus,
  CandidateRecord,
  CoachingSessionRecord,
  CompetencyAssessmentRecord,
  EvidenceRecord,
  GateReviewRecord,
  KpiRecord,
  Store,
  UserActionHistoryEntry,
  UserActionRecord,
  UserRecord,
  WeeklyReviewRecord,
} from "./types";

export interface DemoUser extends UserRecord {
  email: string;
  nick: string;
  role: "um" | "coach" | "al" | "admin";
  color: string;
}

export interface DemoSeed {
  store: Store;
  users: DemoUser[];
}

const A_STATUS_TH: Record<ActionStatus, string> = {
  not_started: "ยังไม่เริ่ม",
  in_progress: "กำลังทำ",
  submitted: "ส่งแล้ว",
  waiting_review: "รอโค้ชรีวิว",
  verified: "ยืนยันแล้ว",
  needs_revision: "ต้องแก้ไข",
  completed: "เสร็จแล้ว",
};

export function buildDemoSeed(): DemoSeed {
  const T = today();
  const D = (n: number) => iso(addDays(T, n));
  const TS = (n: number, h = 10) => {
    const d = addDays(T, n);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), h, 15, 0)).toISOString();
  };

  const phases = defaultPhases();
  const actions = defaultActions();
  const competencies = defaultCompetencies();
  const settings = defaultSettings();

  const users: DemoUser[] = [
    { id: "u_um1", code: "Future UM 01", name: "เกรียงไกร ทดลอง", nick: "เกรียง", email: "um01@demo.prime", role: "um", coachId: "u_coach1", alId: "u_al1", cohortId: "co1", startDate: D(-100), currentPhase: 4, color: "#B84C00" },
    { id: "u_um2", code: "Future UM 02", name: "ปาริชาติ ทดลอง", nick: "ปา", email: "um02@demo.prime", role: "um", coachId: "u_coach1", alId: "u_al1", cohortId: "co1", startDate: D(-58), currentPhase: 3, color: "#1F58B5" },
    { id: "u_um3", code: "Future UM 03", name: "ธนวัฒน์ ทดลอง", nick: "ธน", email: "um03@demo.prime", role: "um", coachId: "u_coach1", alId: "u_al1", cohortId: "co1", startDate: D(-41), currentPhase: 2, color: "#1E7A48" },
    // Staff carry the cohort they staff on the same `cohortId` field (they aren't
    // program participants, but this lets /team's cohort-scoped sections —
    // Leaderboard, roster, Team Expedition creation — resolve "their" cohort
    // without a separate staffing-assignment model, which is out of scope here.
    { id: "u_coach1", code: "Coach 01", name: "อรุณ โค้ชทดลอง", nick: "โค้ชอรุณ", email: "coach01@demo.prime", role: "coach", coachId: null, alId: null, cohortId: "co1", startDate: D(0), currentPhase: 1, color: "#3B3B3B" },
    { id: "u_al1", code: "AL 01", name: "วิภา ผู้จัดการทดลอง", nick: "พี่วิภา", email: "al01@demo.prime", role: "al", coachId: null, alId: null, cohortId: "co1", startDate: D(0), currentPhase: 1, color: "#111111" },
    { id: "u_admin1", code: "Admin 01", name: "แอดมิน ระบบทดลอง", nick: "แอดมิน", email: "admin01@demo.prime", role: "admin", coachId: null, alId: null, cohortId: null, startDate: D(0), currentPhase: 1, color: "#6B3FA0" },
  ];

  const userActions: UserActionRecord[] = [];
  const evidence: EvidenceRecord[] = [];
  const kpis: KpiRecord[] = [];
  const candidates: CandidateRecord[] = [];
  const coaching: CoachingSessionRecord[] = [];
  const weekly: WeeklyReviewRecord[] = [];
  const assessments: CompetencyAssessmentRecord[] = [];
  const gateReviews: GateReviewRecord[] = [];

  function put(u: string, aid: string, status: ActionStatus, dayDone: number | null) {
    const doneAt = dayDone != null ? TS(dayDone) : null;
    const history: UserActionHistoryEntry[] = [{ at: doneAt || TS(-2), by: u, text: "สถานะ: " + A_STATUS_TH[status] }];
    userActions.push({
      userId: u,
      actionId: aid,
      status,
      startedAt: doneAt ? TS(dayDone! - 3) : TS(-2),
      completedAt: DONE.has(status) ? doneAt : null,
      notes: "",
      history,
    });
  }

  let evCount = 0;
  function addEv(u: string, aid: string, status: EvidenceRecord["status"], day: number, descriptionOverride?: string) {
    const i = evCount++;
    evidence.push({
      id: `ev_${u}_${aid}_${i}`,
      userId: u,
      actionId: aid,
      status,
      createdAt: TS(day),
      reviewedAt: status === "verified" || status === "revision" ? TS(day + 1) : null,
    });
    void descriptionOverride; // description text is UI-only; not modeled in Store
  }

  function completePhases(u: string, startOffset: number, uptoPhase: number, skipIds: string[] = []) {
    actions
      .filter((a) => Number(a.phaseId.slice(1)) < uptoPhase && !skipIds.includes(a.id))
      .forEach((a) => {
        const day = startOffset + a.dueOffset - 1 - 2;
        const st: ActionStatus = a.evidence ? "verified" : "completed";
        put(u, a.id, st, day);
        if (a.evidence) addEv(u, a.id, "verified", day);
      });
  }

  // UM01 — day 101, RECRUIT
  completePhases("u_um1", -100, 4);
  put("u_um1", "a401", "verified", -15);
  addEv("u_um1", "a401", "verified", -15);
  put("u_um1", "a402", "completed", -4);
  put("u_um1", "a403", "in_progress", null);
  put("u_um1", "a404", "waiting_review", null);
  addEv("u_um1", "a404", "submitted", -1);
  put("u_um1", "a406", "in_progress", null);

  // UM02 — day 59, PRODUCE
  completePhases("u_um2", -58, 3, ["a206"]);
  put("u_um2", "a301", "verified", -10);
  addEv("u_um2", "a301", "verified", -10);
  put("u_um2", "a302", "in_progress", null);
  put("u_um2", "a305", "in_progress", null);

  // UM03 — day 42, BUILD (behind)
  completePhases("u_um3", -41, 2);
  put("u_um3", "a201", "verified", -16);
  addEv("u_um3", "a201", "verified", -16);
  put("u_um3", "a202", "needs_revision", null);
  addEv("u_um3", "a202", "revision", -9);

  // gate reviews
  const gr = (u: string, p: string, day: number) =>
    gateReviews.push({ id: `gr_${u}_${p}`, userId: u, phaseId: p, status: "approved", requestedAt: TS(day - 1), reviewedAt: TS(day), comment: "ผ่านเกณฑ์ภายใน ไปต่อได้" });
  gr("u_um1", "p1", -86); gr("u_um1", "p2", -55); gr("u_um1", "p3", -25);
  gr("u_um2", "p1", -44); gr("u_um2", "p2", -13);
  gr("u_um3", "p1", -24);

  // KPI (6 months)
  const months = lastMonths(6);
  const tg = settings.kpiTargets;
  function kp(u: string, prof: Record<string, number[]>) {
    months.forEach((m, i) => {
      const cur = i === months.length - 1;
      const f = cur ? Math.min(1, today().getUTCDate() / 30) : 1;
      Object.entries(prof).forEach(([metric, base]) => {
        if (base == null) return;
        const v = base[i % base.length];
        kpis.push({
          userId: u,
          period: m,
          metric,
          target: tg[metric],
          actual: Math.round(v * f * (metric === "fyp" || metric === "teamFyp" ? 1000 : 1)),
        });
      });
    });
  }
  kp("u_um1", { fyp: [52, 61, 58, 70, 66, 74], nbc: [35, 42, 38, 44, 41, 46], cases: [3, 4, 4, 5, 4, 5], activity: [70, 82, 78, 90, 85, 92], appointments: [12, 15, 14, 17, 16, 18], training: [1, 2, 2, 2, 1, 2], oneOnOne: [1, 2, 3, 3, 4, 4], teamMeetings: [0, 1, 1, 2, 2, 3], teamActivity: [0, 0, 20, 40, 60, 80] });
  kp("u_um2", { fyp: [60, 64, 71, 68, 77, 80], nbc: [40, 45, 47, 44, 49, 52], cases: [4, 4, 5, 5, 6, 6], activity: [85, 88, 92, 95, 96, 99], appointments: [16, 17, 18, 18, 19, 20], training: [2, 2, 2, 3, 2, 2], oneOnOne: [1, 1, 2, 2, 2, 3], teamMeetings: [0, 0, 1, 1, 1, 1] });
  kp("u_um3", { fyp: [40, 38, 35, 30, 26, 22], nbc: [30, 28, 26, 24, 22, 20], cases: [3, 2, 2, 2, 1, 1], activity: [60, 55, 48, 40, 35, 30], appointments: [10, 9, 8, 7, 6, 5], training: [1, 1, 1, 0, 0, 1], oneOnOne: [0, 0, 1, 0, 0, 0] });

  // candidates
  const names = ["สมชาย ตัวอย่าง", "วรรณา ตัวอย่าง", "ปกรณ์ ตัวอย่าง", "นภัสสร ตัวอย่าง", "ชยพล ตัวอย่าง", "กมลชนก ตัวอย่าง", "ศุภชัย ตัวอย่าง", "อัญชลี ตัวอย่าง", "ธีรเดช ตัวอย่าง", "พิมพ์ชนก ตัวอย่าง", "ณัฐวุฒิ ตัวอย่าง", "รัชนี ตัวอย่าง", "อนุชา ตัวอย่าง", "สุภาวดี ตัวอย่าง", "ภาคิน ตัวอย่าง", "จิราพร ตัวอย่าง", "วีรยุทธ ตัวอย่าง", "เบญจมาศ ตัวอย่าง", "ปิยะ ตัวอย่าง"];
  const stages1 = [5, 4, 3, 3, 2, 1, 1, 1, 1, 1, 1, 0, 0, 0];
  const nextA = ["นัดคุยเรื่องวันเริ่มงานและสอบใบอนุญาต", "ติดตามผลหลังนำเสนออาชีพ", "นัดนำเสนออาชีพ", "ส่งเอกสารแนะนำบริษัท", "นัดสัมภาษณ์", "นัดสัมภาษณ์", "โทรติดตาม", "ชวนเข้า Opportunity meeting", "โทรติดตาม", "ส่งข้อความแนะนำตัว", "โทรครั้งที่ 2", "ติดต่อครั้งแรก", "ติดต่อครั้งแรก", "ติดต่อครั้งแรก"];
  const nextDays1 = [0, 1, 2, 3, 0, 4, 5, 2, 6, 1, 3, 7, 8, 9];

  function cand(owner: string, i: number, stage: number, nd: number, status: "active" | "lost" = "active") {
    const activities = [];
    for (let s = 1; s <= stage; s++) activities.push({ at: TS(-40 + s * 6 + (i % 4)), type: `stage_${s}`, text: `บันทึกสถานะ`, by: owner });
    candidates.push({
      id: `cd_${owner}_${i}`,
      ownerId: owner,
      name: names[i % names.length],
      stage,
      status,
      nextAction: status === "lost" ? "" : nextA[i] || "ติดตาม",
      nextActionDate: status === "lost" ? null : D(nd),
      updatedAt: activities.length ? activities[activities.length - 1].at : TS(-45 + i),
      activities,
    });
  }
  stages1.forEach((s, i) => cand("u_um1", i, s, nextDays1[i]));
  cand("u_um1", 14, 2, 0, "lost");
  [2, 1, 1, 0, 0].forEach((s, i) => cand("u_um2", 15 + i, s, i + 2));

  // coaching
  function cs(u: string, coachId: string, day: number, topic: string, status: "scheduled" | "completed", kind: "received" | "given" = "received", actionPlan = "ฝึกตั้งคำถามปลายเปิด 3 ข้อในการคุยครั้งถัดไป", followUpOffset = 7) {
    coaching.push({ id: `cs_${u}_${day}_${topic.slice(0, 6)}`, userId: u, coachId, kind, date: D(day), topic, actionPlan, followUpDate: D(day + followUpOffset), status });
  }
  cs("u_um1", "u_coach1", -60, "การนำ Team Meeting", "completed");
  cs("u_um1", "u_coach1", -38, "Target vs Actual", "completed");
  cs("u_um1", "u_coach1", -24, "เทคนิคการสัมภาษณ์ผู้สมัคร", "completed");
  cs("u_um1", "u_coach1", -10, "Career Presentation ให้ตรงใจผู้สมัคร", "completed", "received", "ปรับ deck ให้มีเส้นทางอาชีพ 3 ขั้น และซ้อมกับโค้ชก่อนนำเสนอจริง", 2);
  cs("u_um1", "u_coach1", 0, "เตรียม Recruit Gate", "scheduled");
  cs("u_um1", "u_um1", -20, "ฝึก 1-on-1 กับเพื่อนร่วมทีม", "completed", "given");
  cs("u_um1", "u_um1", -8, "ติดตามกิจกรรมรายสัปดาห์", "completed", "given");
  cs("u_um2", "u_coach1", -40, "Personal Development Plan", "completed");
  cs("u_um2", "u_coach1", -20, "การตั้งเป้ารายเดือน", "completed");
  cs("u_um2", "u_coach1", -6, "Activity management", "completed", "received", "บันทึก Activity ทุกวันศุกร์ก่อน 18:00", 1);
  cs("u_um3", "u_coach1", -33, "Gap Analysis", "completed", "received", "ตั้งเวลาโทรหาลูกค้า 1 ชั่วโมงทุกเช้า");

  // weekly reviews
  function wk(u: string, wOff: number, status: "submitted" | "reviewed", coachComment?: string) {
    const ws = iso(addDays(weekStart(today()), wOff * 7));
    weekly.push({
      id: `wr_${u}_${ws}`,
      userId: u,
      weekStart: ws,
      status,
      submittedAt: TS(wOff * 7 + 4, 18),
      priorities: ["นำเสนออาชีพ 1 ครั้ง", "ติดต่อผู้สมัครใหม่ 3 คน", "ปิดเคส 1 เคส"],
    });
    void coachComment; // UI display text only
  }
  wk("u_um1", -3, "reviewed"); wk("u_um1", -2, "reviewed"); wk("u_um1", -1, "submitted");
  wk("u_um2", -2, "reviewed"); wk("u_um2", -1, "reviewed");
  wk("u_um3", -4, "reviewed");

  // assessments
  function asm(u: string, scores: Record<string, number[]>, day: number) {
    competencies.forEach((c, i) => {
      const s = scores[c.category];
      if (s == null) return;
      const v = s[i % s.length];
      assessments.push({ id: `as_${u}_${c.id}`, userId: u, competencyId: c.id, score: v, assessedAt: TS(day) });
    });
  }
  asm("u_um1", { production: [4, 4, 3, 4], recruitment: [3, 3, 3, 2, 3, 2], development: [3, 3, 4, 3], leadership: [3, 4, 3, 3, 3], management: [3, 3, 2, 3, 3] }, -12);
  asm("u_um2", { production: [4, 4, 4, 3], recruitment: [2, 2, 2, 1, 2, 1], development: [2, 3, 3, 2], leadership: [2, 3, 2, 2, 2], management: [3, 3, 2, 3, 2] }, -15);
  asm("u_um3", { production: [2, 2, 2, 1], recruitment: [1, 1, 2, 1, 1, 1], development: [1, 2, 2, 1], leadership: [2, 2, 1, 1, 2], management: [1, 2, 1, 1, 1] }, -30);

  const store: Store = {
    settings,
    phases,
    actions,
    competencies,
    users,
    userActions,
    evidence,
    kpis,
    candidates,
    coaching,
    weekly,
    assessments,
    gateReviews,
  };

  return { store, users };
}
