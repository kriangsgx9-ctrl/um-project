import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadStoreForUser } from "@/lib/data/load-store";
import { phaseProgress, userById } from "@/lib/domain/actions";
import { WorldMap } from "@/components/WorldMap";
import { DEFAULT_AVATAR_CONFIG, type AvatarConfig } from "@/lib/avatar";

export default async function JourneyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [store, dbUser] = await Promise.all([
    loadStoreForUser(prisma, session.user.id),
    prisma.user.findUniqueOrThrow({ where: { id: session.user.id } }),
  ]);
  const user = userById(store, session.user.id)!;
  const phase = store.phases.find((p) => p.no === user.currentPhase);
  const currentPhaseProgressPct = phase ? phaseProgress(store, user, phase) : 0;
  const phasesPassed = user.currentPhase - 1;
  const avatarConfig = (dbUser.avatarConfig as AvatarConfig | null) ?? DEFAULT_AVATAR_CONFIG;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">My Journey</h1>
      <WorldMap
        phases={store.phases}
        currentPhase={user.currentPhase}
        currentPhaseProgressPct={currentPhaseProgressPct}
        avatarConfig={avatarConfig}
        phasesPassed={phasesPassed}
      />
      <ul className="flex flex-col gap-2">
        {store.phases.map((p) => (
          <li key={p.id}>
            <a href={`/journey/${p.id}`} className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 text-sm">
              <span className="font-medium">
                Phase {p.no} — {p.key}
              </span>
              <span className="text-zinc-400">
                {p.no < user.currentPhase ? "ผ่านแล้ว" : p.no === user.currentPhase ? "กำลังทำ" : "ยังไม่เปิด"}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
