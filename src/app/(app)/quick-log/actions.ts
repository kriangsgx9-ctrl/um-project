"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { awardFunnelStageXp, awardXp } from "@/lib/game/xp-engine";
import { getBangkokWeekKey } from "@/lib/game/clock";
import { defaultSettings } from "@/lib/domain/program-data";
import { addDays, iso, monthKey, today } from "@/lib/domain/dates";
import { saveEvidenceFiles } from "@/lib/storage/evidence-files";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("not authenticated");
  return session.user.id;
}

export type ContactOutcome = "contacted" | "interview" | "unavailable";

const OUTCOME_STAGE: Record<ContactOutcome, number | null> = { contacted: 1, interview: 2, unavailable: null };
const OUTCOME_LABEL: Record<ContactOutcome, string> = { contacted: "ติดต่อได้", interview: "นัดสัมภาษณ์", unavailable: "ไม่ว่าง" };

/** §4.2 flow 1: pick a candidate (tap), pick an outcome (tap) — 2 taps, no typing. */
export async function logCandidateContactAction(candidateId: string, outcome: ContactOutcome): Promise<void> {
  const userId = await requireUserId();
  const candidate = await prisma.candidate.findUniqueOrThrow({ where: { id: candidateId } });
  if (candidate.ownerId !== userId) throw new Error("not your candidate");

  const minStage = OUTCOME_STAGE[outcome];
  const newStage = minStage != null ? Math.max(candidate.stage, minStage) : candidate.stage;
  const now = new Date();
  const activities = (candidate.activities as { at: string; type: string; text: string; by: string }[]) ?? [];

  await prisma.candidate.update({
    where: { id: candidateId },
    data: {
      stage: newStage,
      nextAction: outcome === "unavailable" ? candidate.nextAction : outcome === "interview" ? "เตรียมสัมภาษณ์" : "ติดตามผล",
      nextActionDate: outcome === "unavailable" ? addDays(today(), 3) : addDays(today(), 1),
      activities: [...activities, { at: now.toISOString(), type: outcome, text: `บันทึกผลติดต่อ: ${OUTCOME_LABEL[outcome]}`, by: userId }],
    },
  });

  if (newStage > candidate.stage) {
    await awardFunnelStageXp(prisma, { userId, candidateId, fromStage: candidate.stage, toStage: newStage, occurredAt: now });
  }

  revalidatePath("/dashboard");
  revalidatePath("/recruitment");
}

export type KpiMetric = "activity" | "appointments" | "cases";

/** §4.2 flow 2: +/- steppers, no typing. */
export async function logKpiAction(metric: KpiMetric, delta: number): Promise<void> {
  const userId = await requireUserId();
  const period = monthKey(today());
  const target = defaultSettings().kpiTargets[metric] ?? 0;

  const existing = await prisma.kPIRecord.findUnique({ where: { userId_period_metric: { userId, period, metric } } });
  const actual = Math.max(0, (existing?.actual ?? 0) + delta);

  await prisma.kPIRecord.upsert({
    where: { userId_period_metric: { userId, period, metric } },
    create: { userId, period, metric, target, actual },
    update: { actual },
  });

  // sourceId is week-scoped (not month-scoped like KPIRecord itself) so the unique
  // constraint's dedupe granularity matches the "max 1x/week" cap in lib/game/caps.ts.
  await awardXp(prisma, { userId, type: "kpi_logged", sourceType: "weekly", sourceId: `${userId}:${getBangkokWeekKey(new Date())}` });
  revalidatePath("/dashboard");
  revalidatePath("/performance");
}

/**
 * §4.2 flow 3: evidence submission with real attached files (image/PDF),
 * persisted via saveEvidenceFiles (local disk under public/uploads — see that
 * module's comment for why, S3 is a later sprint per v1 §31/§43).
 */
export async function submitEvidenceAction(actionId: string, note: string, formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const action = await prisma.action.findUniqueOrThrow({ where: { id: actionId } });
  const now = new Date();

  const evidence = await prisma.evidence.create({
    data: {
      userId,
      actionId,
      phaseId: action.phaseId,
      category: action.category,
      title: action.title,
      description: note,
      status: "submitted",
      date: today(),
      submittedAt: now,
    },
  });

  const incomingFiles = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (incomingFiles.length) {
    const savedFiles = await saveEvidenceFiles(userId, evidence.id, incomingFiles);
    if (savedFiles.length) {
      await prisma.evidence.update({ where: { id: evidence.id }, data: { files: savedFiles as unknown as Prisma.InputJsonValue } });
    }
  }

  await prisma.userAction.upsert({
    where: { userId_actionId: { userId, actionId } },
    create: { userId, actionId, status: "waiting_review" },
    update: { status: "waiting_review" },
  });

  await awardXp(prisma, { userId, type: "evidence_submitted", sourceType: "evidence", sourceId: evidence.id, occurredAt: now });
  revalidatePath("/dashboard");
  revalidatePath("/evidence");
}

/** §4.2 flow 4: short 3-field form (topic, note, follow-up date). */
export async function logCoachingAction(topic: string, note: string, followUpDate: string): Promise<void> {
  const userId = await requireUserId();
  await prisma.coachingSession.create({
    data: {
      userId,
      coachId: userId, // self-given (peer coaching), matches the "given" convention used in prisma/seed.ts
      kind: "given",
      date: today(),
      topic,
      actionPlan: note,
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      status: "completed",
    },
  });

  await awardXp(prisma, { userId, type: "team_coaching_logged", sourceType: "coaching", sourceId: `${userId}:${iso(today())}:${topic.slice(0, 20)}` });
  revalidatePath("/dashboard");
  revalidatePath("/development");
}
