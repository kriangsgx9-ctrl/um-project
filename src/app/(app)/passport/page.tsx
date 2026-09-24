import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadStoreForUser } from "@/lib/data/load-store";
import { userById } from "@/lib/domain/actions";
import { DIMS, readiness, readinessBand } from "@/lib/domain/readiness";
import { badges } from "@/lib/domain/badges";
import { diffDays, today } from "@/lib/domain/dates";
import { renderAvatarSvg, DEFAULT_AVATAR_CONFIG, type AvatarConfig } from "@/lib/avatar";
import { ReadinessRadar } from "@/components/ReadinessRadar";

export default async function PassportPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [store, dbUser] = await Promise.all([
    loadStoreForUser(prisma, userId),
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
  ]);
  const user = userById(store, userId)!;
  const r = readiness(store, userId);
  const band = readinessBand(store, r.total);
  const badgeList = badges(store, userId);
  const gatesPassed = store.gateReviews.filter((g) => g.status === "approved").length;
  const daysInProgram = Math.max(0, diffDays(today(), user.startDate));
  const avatarConfig = (dbUser.avatarConfig as AvatarConfig | null) ?? DEFAULT_AVATAR_CONFIG;

  const radarData = DIMS.map((d) => ({ dimension: d.th, value: r.dims[d.k] ?? 0 }));

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div className="rounded-2xl bg-[#111111] text-white p-6 flex items-center gap-4">
        {renderAvatarSvg(avatarConfig, user.currentPhase - 1, 72)}
        <div>
          <h1 className="text-xl font-bold">{user.name}</h1>
          <div className="text-sm text-zinc-400">{user.code}</div>
          <div className="text-sm text-zinc-400">
            Phase {user.currentPhase}/{store.phases.length} · วันที่ {daysInProgram} ในโปรแกรม
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl border border-zinc-200 p-3">
          <div className="text-2xl font-bold">{r.total}</div>
          <div className="text-xs text-zinc-500">{band.th}</div>
        </div>
        <div className="rounded-xl border border-zinc-200 p-3">
          <div className="text-2xl font-bold">{gatesPassed}</div>
          <div className="text-xs text-zinc-500">Gates ผ่านแล้ว</div>
        </div>
        <div className="rounded-xl border border-zinc-200 p-3">
          <div className="text-2xl font-bold">{badgeList.filter((b) => b.ok).length}</div>
          <div className="text-xs text-zinc-500">Badges</div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 p-4">
        <h2 className="font-semibold mb-2">Internal UM Readiness</h2>
        <ReadinessRadar data={radarData} />
        <p className="text-xs text-zinc-400 mt-2">
          ค่าสถานะนี้เป็นตัวชี้วัดการพัฒนาภายใน ไม่ใช่ผลพิจารณาเลื่อนตำแหน่ง
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 p-4">
        <h2 className="font-semibold mb-3">Badges</h2>
        <div className="grid grid-cols-2 gap-2">
          {badgeList.map((b) => (
            <div
              key={b.k}
              className={`rounded-xl border p-3 text-sm font-medium ${b.ok ? "border-[#ffb800] bg-[#fff8e6]" : "border-zinc-200 text-zinc-400"}`}
            >
              {b.l}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
