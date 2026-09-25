import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_AVATAR_CONFIG, type AvatarConfig } from "@/lib/avatar";
import { AvatarBuilder } from "@/components/AvatarBuilder";
import { ProfessionalModeToggle } from "@/components/ProfessionalModeToggle";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const avatarConfig = (user.avatarConfig as AvatarConfig | null) ?? DEFAULT_AVATAR_CONFIG;

  return (
    <div className="flex flex-col gap-6 max-w-md">
      <h1 className="text-2xl font-bold">ฉัน</h1>
      <AvatarBuilder initial={avatarConfig} phasesPassed={user.currentPhase - 1} />
      <div className="rounded-2xl border border-zinc-200 p-4 shadow-card">
        <h2 className="font-semibold mb-1">Professional Mode</h2>
        <p className="text-xs text-zinc-500 mb-3">
          ซ่อน XP, Level, Streak, Leaderboard และแอนิเมชันฉลอง — ใช้ตอนนำเสนอผู้บริหาร ข้อมูลเบื้องหลังยังเก็บตามปกติ
        </p>
        <ProfessionalModeToggle initialEnabled={user.professionalMode} />
      </div>
      <a href="/passport" className="text-sm text-[#b84c00] font-medium">
        ดู UM Passport ฉบับเต็ม →
      </a>
    </div>
  );
}
