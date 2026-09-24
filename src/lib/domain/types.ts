// Plain-data shapes consumed by the pure domain functions in lib/domain/*.
// Deliberately decoupled from the Prisma models: a `Store` can be built either
// from fixtures (unit tests) or assembled from real Prisma rows (server actions),
// mirroring the prototype's in-memory `S` object closely enough to keep the ported
// logic's behavior identical.

export interface PhaseGateMetric {
  id: string;
  metric: string; // funnel stage key, e.g. 'contact' | 'interview' | 'presentation' | 'onboard'
  min: number;
  title: string;
}

export interface Phase {
  id: string;
  no: number;
  key: string;
  th: string;
  startDay: number;
  endDay: number;
  objective: string;
  mission: string;
  gate: { name: string; metrics: PhaseGateMetric[] };
}

export interface ActionDef {
  id: string;
  phaseId: string;
  title: string;
  category: string;
  dueOffset: number;
  priority: "critical" | "high" | "medium" | "low";
  required: boolean;
  evidence: boolean;
  evidenceHint: string;
  desc: string;
  why: string;
  steps: string[];
  success: string[];
  competencyId: string | null;
  questType?: "main" | "side" | "coach";
  bonusXp?: number | null;
  assignedTo?: string | null;
}

export type ActionStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "waiting_review"
  | "verified"
  | "needs_revision"
  | "completed";

export interface UserActionHistoryEntry {
  at: string;
  by: string;
  text: string;
}

export interface UserActionRecord {
  userId: string;
  actionId: string;
  status: ActionStatus;
  startedAt: string | null;
  completedAt: string | null;
  notes: string;
  history: UserActionHistoryEntry[];
  dueDate?: string | null;
}

export interface Competency {
  id: string;
  category: string;
  name: string;
  description?: string;
}

export interface CompetencyAssessmentRecord {
  id: string;
  userId: string;
  competencyId: string;
  score: number;
  assessedAt: string;
}

export interface EvidenceRecord {
  id: string;
  userId: string;
  actionId: string;
  status: "draft" | "submitted" | "verified" | "revision";
  createdAt: string;
  reviewedAt: string | null;
}

export interface KpiRecord {
  userId: string;
  period: string; // 'YYYY-MM'
  metric: string;
  target: number;
  actual: number;
}

export interface CandidateActivity {
  at: string;
  type: string;
  text: string;
  by: string;
}

export interface CandidateRecord {
  id: string;
  ownerId: string;
  name: string;
  stage: number; // index into STAGES
  status: "active" | "lost";
  nextAction: string;
  nextActionDate: string | null;
  updatedAt: string;
  activities: CandidateActivity[];
}

export interface CoachingSessionRecord {
  id: string;
  userId: string;
  coachId: string;
  kind: "received" | "given";
  date: string;
  topic: string;
  actionPlan: string;
  followUpDate: string | null;
  status: "scheduled" | "completed";
}

export interface WeeklyReviewRecord {
  id: string;
  userId: string;
  weekStart: string;
  status: "draft" | "submitted" | "reviewed";
  submittedAt: string | null;
  priorities: string[];
}

export interface GateReviewRecord {
  id: string;
  userId: string;
  phaseId: string;
  status: "requested" | "approved" | "needs_dev";
  requestedAt: string;
  reviewedAt: string | null;
  comment: string;
}

export interface ReadinessWeights {
  production: number;
  recruitment: number;
  development: number;
  leadership: number;
  management: number;
}

export interface Settings {
  weights: ReadinessWeights;
  readyThreshold: number;
  kpiTargets: Record<string, number>;
  recruitTargets: Record<string, number>;
  coachingTarget: number;
  finalCriteria: { id: string; name: string; max: number }[];
  finalPass: number;
}

export interface UserRecord {
  id: string;
  code: string;
  name: string;
  role: "um" | "coach" | "al" | "admin";
  coachId: string | null;
  alId: string | null;
  cohortId: string | null;
  startDate: string; // 'YYYY-MM-DD'
  currentPhase: number;
}

/** Everything the pure domain functions need, scoped to what's actually queried by them. */
export interface Store {
  settings: Settings;
  phases: Phase[];
  actions: ActionDef[];
  competencies: Competency[];
  users: UserRecord[];
  userActions: UserActionRecord[];
  evidence: EvidenceRecord[];
  kpis: KpiRecord[];
  candidates: CandidateRecord[];
  coaching: CoachingSessionRecord[];
  weekly: WeeklyReviewRecord[];
  assessments: CompetencyAssessmentRecord[];
  gateReviews: GateReviewRecord[];
}
