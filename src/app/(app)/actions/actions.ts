"use server";

// V1 §10/§11 Action Center + Action Detail. "Start Action" and "Complete
// Action" (no-evidence path) are new; the evidence-required completion path
// reuses quick-log/actions.ts's submitEvidenceAction directly rather than
// duplicating it — same Evidence row + XP + file-storage behavior either way.
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { awardXp } from "@/lib/game/xp-engine";
import type { UserActionHistoryEntry } from "@/lib/domain/types";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("not authenticated");
  return session.user.id;
}

async function pushHistory(userId: string, actionId: string, text: string): Promise<Prisma.InputJsonValue> {
  const existing = await prisma.userAction.findUnique({ where: { userId_actionId: { userId, actionId } } });
  const history = (existing?.history as unknown as UserActionHistoryEntry[]) ?? [];
  return [...history, { at: new Date().toISOString(), by: userId, text }] as unknown as Prisma.InputJsonValue;
}

export async function startActionAction(actionId: string): Promise<void> {
  const userId = await requireUserId();
  const now = new Date();
  const history = await pushHistory(userId, actionId, "เริ่มทำ Action");

  await prisma.userAction.upsert({
    where: { userId_actionId: { userId, actionId } },
    create: { userId, actionId, status: "in_progress", startedAt: now, history },
    update: { status: "in_progress", startedAt: now, history },
  });

  await awardXp(prisma, { userId, type: "quest_started", sourceType: "action", sourceId: actionId, occurredAt: now });
  revalidatePath("/actions");
  revalidatePath(`/actions/${actionId}`);
}

export async function completeActionWithoutEvidenceAction(actionId: string): Promise<void> {
  const userId = await requireUserId();
  const action = await prisma.action.findUniqueOrThrow({ where: { id: actionId } });
  if (action.evidence) throw new Error("Action นี้ต้องส่งหลักฐานก่อนถึงจะเสร็จได้");

  const now = new Date();
  const history = await pushHistory(userId, actionId, "ทำเครื่องหมายว่าเสร็จ");

  await prisma.userAction.upsert({
    where: { userId_actionId: { userId, actionId } },
    create: { userId, actionId, status: "completed", completedAt: now, history },
    update: { status: "completed", completedAt: now, history },
  });

  await awardXp(prisma, { userId, type: "quest_no_evidence_completed", sourceType: "action", sourceId: actionId, occurredAt: now });
  revalidatePath("/actions");
  revalidatePath(`/actions/${actionId}`);
}
