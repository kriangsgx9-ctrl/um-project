"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { completeDailyMission } from "@/lib/data/daily-missions-service";

export async function completeDailyMissionAction(missionId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("not authenticated");

  await completeDailyMission(prisma, session.user.id, missionId);
  revalidatePath("/dashboard");
}
