"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { AvatarConfig } from "@/lib/avatar";

export async function updateAvatarAction(config: AvatarConfig): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("not authenticated");

  await prisma.user.update({ where: { id: session.user.id }, data: { avatarConfig: config as unknown as Prisma.InputJsonValue } });
  revalidatePath("/profile");
  revalidatePath("/passport");
  revalidatePath("/journey");
  revalidatePath("/dashboard");
}
