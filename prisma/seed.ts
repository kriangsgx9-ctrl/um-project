// Populates a fresh database with the demo cohort using lib/domain's ported
// business logic (buildDemoSeed) plus default game settings (lib/game's defaults).
// Run via `npm run db:seed` (also wired as the `prisma migrate dev` seed hook).
import "dotenv/config";
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { buildDemoSeed } from "../src/lib/domain/seed";
import { DEFAULT_CAPS } from "../src/lib/game/caps";
import { DEFAULT_LEVEL_CURVE } from "../src/lib/game/level";
import { DEFAULT_XP_TABLE } from "../src/lib/game/xp-table";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/** Plain data -> Prisma's InputJsonValue (round-trips through JSON to strip `undefined`s). */
const toJson = (v: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(v));

const DEMO_PASSWORD = "prime2026"; // dev-only demo credential; every seeded account shares it

async function main() {
  const { store, users } = buildDemoSeed();

  await prisma.gameSettings.upsert({
    where: { id: "default" },
    create: { id: "default", xpTable: toJson(DEFAULT_XP_TABLE), caps: toJson(DEFAULT_CAPS), levelCurve: toJson(DEFAULT_LEVEL_CURVE), leaderboardOn: true, kudosOn: true },
    update: { xpTable: toJson(DEFAULT_XP_TABLE), caps: toJson(DEFAULT_CAPS), levelCurve: toJson(DEFAULT_LEVEL_CURVE) },
  });

  await prisma.cohort.upsert({
    where: { id: "co1" },
    create: { id: "co1", name: "PRIME Future UM รุ่นที่ 1 (Demo)", startDate: new Date(Date.now() - 110 * 86_400_000), endDate: new Date(Date.now() + 70 * 86_400_000), status: "active" },
    update: {},
  });

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      create: {
        id: u.id, code: u.code, name: u.name, nick: u.nick, email: u.email,
        role: u.role, passwordHash, color: u.color,
        cohortId: u.cohortId, coachId: null, alId: null,
        startDate: new Date(u.startDate), currentPhase: u.currentPhase,
      },
      update: {},
    });
  }
  // second pass: wire coach/al relations now that every user row exists
  for (const u of users) {
    if (!u.coachId && !u.alId) continue;
    await prisma.user.update({ where: { id: u.id }, data: { coachId: u.coachId, alId: u.alId } });
  }

  for (const p of store.phases) {
    await prisma.phase.upsert({
      where: { id: p.id },
      create: { id: p.id, no: p.no, key: p.key, th: p.th, startDay: p.startDay, endDay: p.endDay, objective: p.objective, mission: p.mission },
      update: {},
    });
    const gate = await prisma.gate.upsert({
      where: { phaseId: p.id },
      create: { phaseId: p.id, name: p.gate.name, description: "" },
      update: {},
    });
    for (const [i, m] of p.gate.metrics.entries()) {
      await prisma.gateRequirement.upsert({
        where: { id: m.id },
        create: { id: m.id, gateId: gate.id, title: m.title, type: "metric", metric: m.metric, min: m.min, order: i },
        update: {},
      });
    }
  }

  for (const c of store.competencies) {
    await prisma.competency.upsert({
      where: { id: c.id },
      create: { id: c.id, category: c.category, name: c.name, description: c.description ?? "" },
      update: {},
    });
  }

  for (const a of store.actions) {
    await prisma.action.upsert({
      where: { id: a.id },
      create: {
        id: a.id, phaseId: a.phaseId, title: a.title, description: a.desc, category: a.category,
        priority: a.priority, required: a.required, evidence: a.evidence, evidenceHint: a.evidenceHint,
        dueOffset: a.dueOffset, why: a.why, steps: a.steps, success: a.success, competencyId: a.competencyId,
        questType: a.questType ?? "main", bonusXp: a.bonusXp ?? null, assignedTo: a.assignedTo ?? null,
      },
      update: {},
    });
  }

  for (const ua of store.userActions) {
    await prisma.userAction.upsert({
      where: { userId_actionId: { userId: ua.userId, actionId: ua.actionId } },
      create: {
        userId: ua.userId, actionId: ua.actionId, status: ua.status,
        startedAt: ua.startedAt ? new Date(ua.startedAt) : null,
        completedAt: ua.completedAt ? new Date(ua.completedAt) : null,
        notes: ua.notes, history: toJson(ua.history),
      },
      update: {},
    });
  }

  for (const e of store.evidence) {
    const action = store.actions.find((a) => a.id === e.actionId)!;
    await prisma.evidence.upsert({
      where: { id: e.id },
      create: {
        id: e.id, userId: e.userId, actionId: e.actionId, phaseId: action.phaseId,
        category: action.category, title: action.title, status: e.status,
        date: new Date(e.createdAt), createdAt: new Date(e.createdAt),
        submittedAt: new Date(e.createdAt), reviewedAt: e.reviewedAt ? new Date(e.reviewedAt) : null,
        reviewerId: e.reviewedAt ? "u_coach1" : null,
      },
      update: {},
    });
  }

  for (const k of store.kpis) {
    await prisma.kPIRecord.upsert({
      where: { userId_period_metric: { userId: k.userId, period: k.period, metric: k.metric } },
      create: k,
      update: { target: k.target, actual: k.actual },
    });
  }

  for (const c of store.candidates) {
    await prisma.candidate.upsert({
      where: { id: c.id },
      create: {
        id: c.id, ownerId: c.ownerId, name: c.name, source: "Natural market", stage: c.stage,
        status: c.status, nextAction: c.nextAction, nextActionDate: c.nextActionDate ? new Date(c.nextActionDate) : null,
        activities: toJson(c.activities), updatedAt: new Date(c.updatedAt),
      },
      update: {},
    });
  }

  for (const c of store.coaching) {
    await prisma.coachingSession.upsert({
      where: { id: c.id },
      create: {
        id: c.id, userId: c.userId, coachId: c.coachId, kind: c.kind, date: new Date(c.date),
        topic: c.topic, actionPlan: c.actionPlan, followUpDate: c.followUpDate ? new Date(c.followUpDate) : null,
        status: c.status,
      },
      update: {},
    });
  }

  for (const w of store.weekly) {
    await prisma.weeklyReview.upsert({
      where: { userId_weekStart: { userId: w.userId, weekStart: new Date(w.weekStart) } },
      create: {
        id: w.id, userId: w.userId, weekStart: new Date(w.weekStart),
        happened: "", worked: "", didNotWork: "", learned: "", nextWeek: "",
        priorities: w.priorities, status: w.status,
        submittedAt: w.submittedAt ? new Date(w.submittedAt) : null,
      },
      update: {},
    });
  }

  for (const a of store.assessments) {
    await prisma.competencyAssessment.upsert({
      where: { id: a.id },
      create: { id: a.id, userId: a.userId, competencyId: a.competencyId, score: a.score, assessedAt: new Date(a.assessedAt) },
      update: {},
    });
  }

  for (const g of store.gateReviews) {
    const gate = await prisma.gate.findUnique({ where: { phaseId: g.phaseId } });
    if (!gate) continue;
    await prisma.gateReview.upsert({
      where: { id: g.id },
      create: {
        id: g.id, userId: g.userId, gateId: gate.id, status: g.status,
        requestedAt: new Date(g.requestedAt), reviewedAt: g.reviewedAt ? new Date(g.reviewedAt) : null,
        reviewerId: "u_al1", comment: g.comment,
      },
      update: {},
    });
  }

  for (const u of users) {
    await prisma.userProgress.upsert({
      where: { userId: u.id },
      create: { userId: u.id, xp: 0, level: 1, streak: 0, bestStreak: 0, shieldsLeft: 1 },
      update: {},
    });
  }

  console.log(`Seeded ${users.length} users, ${store.actions.length} actions, ${store.candidates.length} candidates.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
