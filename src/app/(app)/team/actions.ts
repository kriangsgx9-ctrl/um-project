"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { awardXp } from "@/lib/game/xp-engine";
import { bangkokDayRangeUtc, toBangkokDateString } from "@/lib/game/clock";

async function requireReviewer(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("not authenticated");
  if (session.user.role !== "al" && session.user.role !== "admin") throw new Error("forbidden: al/admin only");
  return session.user.id;
}

/** §6 "Team Expedition สร้างและติดตามได้จาก AL" — for the AL's own cohort. */
export async function createTeamExpeditionAction(formData: FormData): Promise<void> {
  const reviewerId = await requireReviewer();
  const reviewer = await prisma.user.findUniqueOrThrow({ where: { id: reviewerId } });
  if (!reviewer.cohortId) throw new Error("your account has no cohort assigned");

  const title = String(formData.get("title") ?? "").trim();
  const metric = String(formData.get("metric") ?? "");
  const target = Number(formData.get("target") ?? 0);
  const xpReward = Number(formData.get("xpReward") ?? 0);
  const startAt = new Date(String(formData.get("startAt")));
  const endAt = new Date(String(formData.get("endAt")));
  if (!title || target <= 0 || xpReward <= 0 || isNaN(startAt.getTime()) || isNaN(endAt.getTime())) {
    throw new Error("invalid Team Expedition input");
  }

  await prisma.teamChallenge.create({ data: { cohortId: reviewer.cohortId, title, metric, target, xpReward, startAt, endAt } });
  revalidatePath("/team");
}

const KUDOS_DAILY_LIMIT = 3; // §3.9 "จำกัด 3 ใบ/วัน/คน" — a sending rate limit, not an anti-gaming XP cap

/**
 * §3.9 Kudos — anyone (coach/AL/cohort peers) may send, capped at 3/day/sender.
 * `toUserId` is bound via `.bind(null, id)` on the <form action>, so `formData`
 * (the message textarea) arrives as the trailing argument.
 */
export async function sendKudosAction(toUserId: string, formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("not authenticated");
  const fromId = session.user.id;
  if (fromId === toUserId) throw new Error("cannot send kudos to yourself");

  const message = String(formData.get("message") ?? "").trim();
  if (!message) throw new Error("message required");

  const { start, end } = bangkokDayRangeUtc(toBangkokDateString(new Date()));
  const sentToday = await prisma.kudos.count({ where: { fromId, createdAt: { gte: start, lt: end } } });
  if (sentToday >= KUDOS_DAILY_LIMIT) throw new Error("ส่ง Kudos ครบ 3 ใบวันนี้แล้ว");

  const kudos = await prisma.kudos.create({ data: { fromId, toId: toUserId, message } });
  await awardXp(prisma, { userId: toUserId, type: "kudos_received", sourceType: "kudos", sourceId: kudos.id });

  revalidatePath("/team");
  revalidatePath("/dashboard");
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
