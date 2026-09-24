"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { awardXp } from "@/lib/game/xp-engine";

async function requireReviewer(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("not authenticated");
  if (session.user.role !== "al" && session.user.role !== "admin") throw new Error("forbidden: al/admin only");
  return session.user.id;
}

/** AL approves a Gate — advances the phase and awards the real +500 gate_won XP. */
export async function approveGateAction(gateReviewId: string): Promise<void> {
  const reviewerId = await requireReviewer();
  const review = await prisma.gateReview.findUniqueOrThrow({ where: { id: gateReviewId }, include: { gate: true } });

  await prisma.$transaction([
    prisma.gateReview.update({ where: { id: gateReviewId }, data: { status: "approved", reviewerId, reviewedAt: new Date() } }),
    prisma.user.update({ where: { id: review.userId }, data: { currentPhase: { increment: 1 } } }),
  ]);

  await awardXp(prisma, { userId: review.userId, type: "gate_won", sourceType: "gate", sourceId: review.gateId });
  revalidatePath("/team");
}

/**
 * AL sends the Gate back with a hint — no fabricated "HP refill", gateStatus()
 * already has a needs_dev branch. `gateReviewId` is bound via `.bind(null, id)`
 * on the <form action>, so `formData` (the comment textarea) arrives as the
 * trailing argument Next.js appends automatically.
 */
export async function needsDevGateAction(gateReviewId: string, formData: FormData): Promise<void> {
  const reviewerId = await requireReviewer();
  const comment = String(formData.get("comment") ?? "");
  await prisma.gateReview.update({
    where: { id: gateReviewId },
    data: { status: "needs_dev", comment, reviewerId, reviewedAt: new Date() },
  });
  revalidatePath("/team");
}
