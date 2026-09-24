import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_AVATAR_CONFIG, type AvatarConfig } from "@/lib/avatar";
import { AvatarBuilder } from "@/components/AvatarBuilder";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const avatarConfig = (user.avatarConfig as AvatarConfig | null) ?? DEFAULT_AVATAR_CONFIG;

  return (
    <div className="flex flex-col gap-6 max-w-md">
      <h1 className="text-2xl font-bold">ฉัน</h1>
      <AvatarBuilder initial={avatarConfig} phasesPassed={user.currentPhase - 1} />
      <a href="/passport" className="text-sm text-[#b84c00] font-medium">
        ดู UM Passport ฉบับเต็ม →
      </a>
    </div>
  );
}
