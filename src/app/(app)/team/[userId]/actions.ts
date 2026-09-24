"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { awardXp } from "@/lib/game/xp-engine";
import { addDays, diffDays, today } from "@/lib/domain/dates";

/** Coach: only their assigned Future UMs. AL: only their cohort/team. Admin: anyone. */
export async function requireGuildAccess(targetUserId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("not authenticated");
  const viewer = session.user;
  const target = await prisma.user.findUniqueOrThrow({ where: { id: targetUserId } });

  const allowed =
    viewer.role === "admin" ||
    (viewer.role === "coach" && target.coachId === viewer.id) ||
    (viewer.role === "al" && target.alId === viewer.id);
  if (!allowed) throw new Error("forbidden: not your assigned Future UM");

  return { viewerId: viewer.id, target };
}

/** §6 "Assign Coach Quest" — reuses Action.assignedTo/bonusXp/questType (added in Sprint A, unused until now). */
export async function assignCoachQuestAction(targetUserId: string, formData: FormData): Promise<void> {
  const { viewerId, target } = await requireGuildAccess(targetUserId);

  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("title required");
  const description = String(formData.get("description") ?? "").trim();
  const dueInDays = Number(formData.get("dueInDays") ?? 7);
  const bonusXp = Math.max(0, Math.min(100, Number(formData.get("bonusXp") ?? 0)));
  const requireEvidence = formData.get("requireEvidence") === "on";
  const category = String(formData.get("category") ?? "Coaching");

  // dueDate() (lib/domain/actions.ts) always computes addDays(user.startDate,
  // dueOffset-1) — startDate is the program start, not "today". A coach quest
  // is assigned relative to today, so dueOffset must be back-solved against
  // the target's own startDate for that formula to land on the intended date.
  const dueOffset = diffDays(addDays(today(), dueInDays), target.startDate!) + 1;

  await prisma.action.create({
    data: {
      id: `coach_${randomUUID()}`,
      phaseId: `p${target.currentPhase}`,
      title,
      description,
      category,
      priority: "medium",
      required: false,
      evidence: requireEvidence,
      dueOffset,
      questType: "coach",
      bonusXp,
      assignedTo: targetUserId,
      assignedBy: viewerId,
    },
  });

  revalidatePath(`/team/${targetUserId}`);
}

/** Evidence Review Queue — Verify awards the real +80 evidence_verified XP. */
export async function verifyEvidenceAction(targetUserId: string, evidenceId: string): Promise<void> {
  const { viewerId } = await requireGuildAccess(targetUserId);
  const evidence = await prisma.evidence.findUniqueOrThrow({ where: { id: evidenceId } });
  if (evidence.userId !== targetUserId) throw new Error("evidence does not belong to this user");

  await prisma.evidence.update({
    where: { id: evidenceId },
    data: { status: "verified", reviewerId: viewerId, reviewedAt: new Date() },
  });
  await prisma.userAction.upsert({
    where: { userId_actionId: { userId: targetUserId, actionId: evidence.actionId } },
    create: { userId: targetUserId, actionId: evidence.actionId, status: "verified", completedAt: new Date() },
    update: { status: "verified", completedAt: new Date() },
  });

  await awardXp(prisma, { userId: targetUserId, type: "evidence_verified", sourceType: "evidence", sourceId: evidence.id });
  revalidatePath(`/team/${targetUserId}`);
}

/**
 * Needs Revision — no XP to reverse: Quick Log's evidence stub only ever
 * creates 'submitted' rows (never auto-verifies), so nothing was awarded yet
 * beyond the submission credit, which correctly stays regardless of outcome.
 * `evidenceId` is bound via `.bind(null, targetUserId, evidenceId)`, so
 * `formData` (the comment) arrives as the trailing argument.
 */
export async function requestRevisionAction(targetUserId: string, evidenceId: string, formData: FormData): Promise<void> {
  const { viewerId } = await requireGuildAccess(targetUserId);
  const comment = String(formData.get("comment") ?? "").trim();
  if (!comment) throw new Error("a comment is required before requesting revision");

  const evidence = await prisma.evidence.findUniqueOrThrow({ where: { id: evidenceId } });
  if (evidence.userId !== targetUserId) throw new Error("evidence does not belong to this user");

  await prisma.evidence.update({
    where: { id: evidenceId },
    data: { status: "revision", reviewerId: viewerId, reviewerComment: comment, reviewedAt: new Date() },
  });
  await prisma.userAction.upsert({
    where: { userId_actionId: { userId: targetUserId, actionId: evidence.actionId } },
    create: { userId: targetUserId, actionId: evidence.actionId, status: "needs_revision", notes: comment },
    update: { status: "needs_revision", notes: comment },
  });

  revalidatePath(`/team/${targetUserId}`);
}
