// Assembles the `Store` shape the pure lib/domain functions expect (the same
// shape already exercised by src/lib/domain/seed.test.ts) from real Prisma rows,
// scoped to a single user's self-view. No other user is ever looked up by
// readiness()/gateRequirements()/risks()/todayItems()/weeklyPriorities()/badges()
// in a self-view, so `store.users` only needs the current user.
import type { PrismaClient } from "@prisma/client";
import { defaultSettings } from "@/lib/domain/program-data";
import type {
  ActionDef,
  CandidateRecord,
  CoachingSessionRecord,
  CompetencyAssessmentRecord,
  EvidenceRecord,
  GateReviewRecord,
  KpiRecord,
  Phase,
  Store,
  UserActionRecord,
  UserRecord,
  WeeklyReviewRecord,
} from "@/lib/domain/types";

const toDateStr = (d: Date): string => d.toISOString().slice(0, 10);

export async function loadStoreForUser(prisma: PrismaClient, userId: string): Promise<Store> {
  const [user, phases, gates, actions, competencies, userActions, evidence, kpis, candidates, coaching, weekly, assessments, gateReviews] =
    await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: userId } }),
      prisma.phase.findMany({ orderBy: { no: "asc" } }),
      prisma.gate.findMany({ include: { requirements: true } }),
      prisma.action.findMany(),
      prisma.competency.findMany(),
      prisma.userAction.findMany({ where: { userId } }),
      prisma.evidence.findMany({ where: { userId } }),
      prisma.kPIRecord.findMany({ where: { userId } }),
      prisma.candidate.findMany({ where: { ownerId: userId } }),
      prisma.coachingSession.findMany({ where: { userId } }),
      prisma.weeklyReview.findMany({ where: { userId } }),
      prisma.competencyAssessment.findMany({ where: { userId } }),
      prisma.gateReview.findMany({ where: { userId } }),
    ]);

  const gateByPhaseId = new Map(gates.map((g) => [g.phaseId, g]));
  const gateIdToPhaseId = new Map(gates.map((g) => [g.id, g.phaseId]));

  const storePhases: Phase[] = phases.map((p) => {
    const gate = gateByPhaseId.get(p.id);
    return {
      id: p.id,
      no: p.no,
      key: p.key,
      th: p.th,
      startDay: p.startDay,
      endDay: p.endDay,
      objective: p.objective,
      mission: p.mission,
      gate: {
        name: gate?.name ?? "",
        metrics: (gate?.requirements ?? [])
          .filter((r) => r.type === "metric" && r.metric && r.min != null)
          .map((r) => ({ id: r.id, metric: r.metric as string, min: r.min as number, title: r.title })),
      },
    };
  });

  const storeActions: ActionDef[] = actions.map((a) => ({
    id: a.id,
    phaseId: a.phaseId,
    title: a.title,
    category: a.category,
    dueOffset: a.dueOffset,
    priority: a.priority as ActionDef["priority"],
    required: a.required,
    evidence: a.evidence,
    evidenceHint: a.evidenceHint,
    desc: a.description,
    why: a.why,
    steps: (a.steps as string[]) ?? [],
    success: (a.success as string[]) ?? [],
    competencyId: a.competencyId,
    questType: a.questType as ActionDef["questType"],
    bonusXp: a.bonusXp,
    assignedTo: a.assignedTo,
  }));

  const storeUserActions: UserActionRecord[] = userActions.map((ua) => ({
    userId: ua.userId,
    actionId: ua.actionId,
    status: ua.status,
    startedAt: ua.startedAt?.toISOString() ?? null,
    completedAt: ua.completedAt?.toISOString() ?? null,
    notes: ua.notes,
    history: (ua.history as unknown as UserActionRecord["history"]) ?? [],
    dueDate: ua.dueDate ? toDateStr(ua.dueDate) : null,
  }));

  const storeEvidence: EvidenceRecord[] = evidence.map((e) => ({
    id: e.id,
    userId: e.userId,
    actionId: e.actionId,
    status: e.status,
    createdAt: e.createdAt.toISOString(),
    reviewedAt: e.reviewedAt?.toISOString() ?? null,
  }));

  const storeKpis: KpiRecord[] = kpis.map((k) => ({ userId: k.userId, period: k.period, metric: k.metric, target: k.target, actual: k.actual }));

  const storeCandidates: CandidateRecord[] = candidates.map((c) => ({
    id: c.id,
    ownerId: c.ownerId,
    name: c.name,
    stage: c.stage,
    status: c.status,
    nextAction: c.nextAction,
    nextActionDate: c.nextActionDate ? toDateStr(c.nextActionDate) : null,
    updatedAt: c.updatedAt.toISOString(),
    activities: (c.activities as unknown as CandidateRecord["activities"]) ?? [],
  }));

  const storeCoaching: CoachingSessionRecord[] = coaching.map((c) => ({
    id: c.id,
    userId: c.userId,
    coachId: c.coachId,
    kind: c.kind as CoachingSessionRecord["kind"],
    date: toDateStr(c.date),
    topic: c.topic,
    actionPlan: c.actionPlan,
    followUpDate: c.followUpDate ? toDateStr(c.followUpDate) : null,
    status: c.status as CoachingSessionRecord["status"],
  }));

  const storeWeekly: WeeklyReviewRecord[] = weekly.map((w) => ({
    id: w.id,
    userId: w.userId,
    weekStart: toDateStr(w.weekStart),
    status: w.status as WeeklyReviewRecord["status"],
    submittedAt: w.submittedAt?.toISOString() ?? null,
    priorities: (w.priorities as string[]) ?? [],
  }));

  const storeAssessments: CompetencyAssessmentRecord[] = assessments.map((a) => ({
    id: a.id,
    userId: a.userId,
    competencyId: a.competencyId,
    score: a.score,
    assessedAt: a.assessedAt.toISOString(),
  }));

  const storeGateReviews: GateReviewRecord[] = gateReviews
    .map((g) => {
      const phaseId = gateIdToPhaseId.get(g.gateId);
      if (!phaseId) return null;
      return {
        id: g.id,
        userId: g.userId,
        phaseId,
        status: g.status,
        requestedAt: g.requestedAt.toISOString(),
        reviewedAt: g.reviewedAt?.toISOString() ?? null,
        comment: g.comment,
      };
    })
    .filter((g): g is GateReviewRecord => g !== null);

  const storeUser: UserRecord = {
    id: user.id,
    code: user.code ?? user.id,
    name: user.name,
    role: user.role,
    coachId: user.coachId,
    alId: user.alId,
    cohortId: user.cohortId,
    startDate: user.startDate ? toDateStr(user.startDate) : toDateStr(new Date()),
    currentPhase: user.currentPhase,
  };

  return {
    // No DB-backed Admin settings table exists yet (readiness weights / KPI
    // targets / recruit targets are Admin-panel scope, v1 §7 — later sprint).
    settings: defaultSettings(),
    phases: storePhases,
    actions: storeActions,
    competencies: competencies.map((c) => ({ id: c.id, category: c.category, name: c.name, description: c.description })),
    users: [storeUser],
    userActions: storeUserActions,
    evidence: storeEvidence,
    kpis: storeKpis,
    candidates: storeCandidates,
    coaching: storeCoaching,
    weekly: storeWeekly,
    assessments: storeAssessments,
    gateReviews: storeGateReviews,
  };
}
