"use server";

// V1 §15 Recruitment Funnel CRUD. Stage advances reuse the same
// awardFunnelStageXp the Quick Log "record contact" flow already uses, so
// there is one XP path for funnel movement regardless of which UI triggers it.
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { awardFunnelStageXp } from "@/lib/game/xp-engine";
import { STAGES } from "@/lib/domain/funnel";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("not authenticated");
  return session.user.id;
}

interface CandidateActivity {
  at: string;
  type: string;
  text: string;
  by: string;
}

export async function addCandidateAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("กรุณากรอกชื่อผู้สมัคร");
  const phone = String(formData.get("phone") ?? "").trim();
  const source = String(formData.get("source") ?? "").trim() || "อื่นๆ";

  await prisma.candidate.create({ data: { ownerId: userId, name, phone, source, stage: 0, status: "active" } });
  revalidatePath("/recruitment");
}

async function requireOwnCandidate(userId: string, candidateId: string) {
  const candidate = await prisma.candidate.findUniqueOrThrow({ where: { id: candidateId } });
  if (candidate.ownerId !== userId) throw new Error("ไม่ใช่ผู้สมัครของคุณ");
  return candidate;
}

export async function advanceCandidateStageAction(candidateId: string, toStage: number, note: string): Promise<void> {
  const userId = await requireUserId();
  const candidate = await requireOwnCandidate(userId, candidateId);
  const now = new Date();
  const activities = (candidate.activities as unknown as CandidateActivity[]) ?? [];
  const newStage = Math.max(candidate.stage, toStage);
  const stageLabel = STAGES[toStage]?.th ?? String(toStage);

  await prisma.candidate.update({
    where: { id: candidateId },
    data: {
      stage: newStage,
      activities: [...activities, { at: now.toISOString(), type: STAGES[toStage]?.k ?? "note", text: note || `ย้ายไปขั้น ${stageLabel}`, by: userId }] as unknown as Prisma.InputJsonValue,
    },
  });

  if (newStage > candidate.stage) {
    await awardFunnelStageXp(prisma, { userId, candidateId, fromStage: candidate.stage, toStage: newStage, occurredAt: now });
  }
  revalidatePath("/recruitment");
}

export async function updateCandidateNoteAction(candidateId: string, formData: FormData): Promise<void> {
  const userId = await requireUserId();
  await requireOwnCandidate(userId, candidateId);
  const notes = String(formData.get("notes") ?? "");
  const nextAction = String(formData.get("nextAction") ?? "");
  const nextActionDateStr = String(formData.get("nextActionDate") ?? "");

  await prisma.candidate.update({
    where: { id: candidateId },
    data: { notes, nextAction, nextActionDate: nextActionDateStr ? new Date(nextActionDateStr) : null },
  });
  revalidatePath("/recruitment");
}

export async function markCandidateLostAction(candidateId: string): Promise<void> {
  const userId = await requireUserId();
  await requireOwnCandidate(userId, candidateId);
  await prisma.candidate.update({ where: { id: candidateId }, data: { status: "lost" } });
  revalidatePath("/recruitment");
}
