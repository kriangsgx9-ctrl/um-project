"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadStoreForUser } from "@/lib/data/load-store";
import { userById } from "@/lib/domain/actions";
import { gateRequirements } from "@/lib/domain/gate";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("not authenticated");
  return session.user.id;
}

/** §3.6 "ท้าชิง Gate" — only allowed once every requirement is real-`ok`. */
export async function requestGateReviewAction(phaseId: string): Promise<void> {
  const userId = await requireUserId();
  const store = await loadStoreForUser(prisma, userId);
  const user = userById(store, userId)!;
  const phase = store.phases.find((p) => p.id === phaseId);
  if (!phase) throw new Error("phase not found");

  const reqs = gateRequirements(store, user, phase);
  if (!reqs.every((r) => r.ok)) throw new Error("gate requirements not met yet");

  const gate = await prisma.gate.findUniqueOrThrow({ where: { phaseId } });
  const existing = await prisma.gateReview.findFirst({ where: { userId, gateId: gate.id, status: "requested" } });
  if (!existing) {
    await prisma.gateReview.create({ data: { userId, gateId: gate.id, status: "requested" } });
  }
  revalidatePath(`/journey/${phaseId}`);
  revalidatePath("/team");
}

/** Dismisses the Victory overlay — makes it show exactly once (V2 §13 AC). */
export async function acknowledgeVictoryAction(gateReviewId: string): Promise<void> {
  const userId = await requireUserId();
  const review = await prisma.gateReview.findUniqueOrThrow({ where: { id: gateReviewId } });
  if (review.userId !== userId) throw new Error("not your gate review");
  await prisma.gateReview.update({ where: { id: gateReviewId }, data: { acknowledgedAt: new Date() } });
  revalidatePath(`/journey`);
}
