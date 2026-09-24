import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadStoreForUser } from "@/lib/data/load-store";
import { ensureTodaysMissions } from "@/lib/data/daily-missions-service";
import { getOrCreateProgress } from "@/lib/game/progress";
import { rankForLevel, xpToNextLevel } from "@/lib/game/level";
import { curPhase, userById } from "@/lib/domain/actions";
import { gateRequirements } from "@/lib/domain/gate";
import { todayItems, type TodayItem } from "@/lib/domain/priorities";
import { DEFAULT_AVATAR_CONFIG, renderAvatarSvg, type AvatarConfig } from "@/lib/avatar";
import { completeDailyMissionAction } from "./actions";

// todayItems() links are prototype-style hash paths; map to the real top-level
// pages that exist so far (per-record detail routes are a later sprint).
function safeLinkFor(item: TodayItem | undefined): string {
  if (!item) return "/actions";
  if (item.kind === "candidate") return "/recruitment";
  if (item.kind === "coaching") return "/development";
  return "/actions";
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [store, dbUser] = await Promise.all([
    loadStoreForUser(prisma, userId),
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
  ]);
  const user = userById(store, userId)!;
  const [progress, missions, recentKudos] = await Promise.all([
    getOrCreateProgress(prisma, userId),
    ensureTodaysMissions(prisma, store, userId),
    prisma.kudos.findMany({ where: { toId: userId }, include: { from: true }, orderBy: { createdAt: "desc" }, take: 3 }),
  ]);
  const avatarConfig = (dbUser.avatarConfig as AvatarConfig | null) ?? DEFAULT_AVATAR_CONFIG;
  const professionalMode = dbUser.professionalMode;
  const sortedMissions = [...missions].sort((a, b) => a.kind.localeCompare(b.kind));

  const xpInfo = xpToNextLevel(progress.xp);
  const rank = rankForLevel(progress.level);
  const phase = curPhase(store, user);
  const gateReqs = phase ? gateRequirements(store, user, phase) : [];
  const gateOk = gateReqs.filter((r) => r.ok).length;
  const items = todayItems(store, user);

  const firstIncomplete = sortedMissions.find((m) => !m.doneAt);
  const nextMissionTitle = firstIncomplete?.title ?? items[0]?.title ?? "วันนี้ยังไม่มีภารกิจใหม่ ดูงานที่ทำค้างได้ที่ Actions";
  const nextMissionLink = firstIncomplete?.link ?? safeLinkFor(items[0]);

  const xpPct = xpInfo.xpNeededForNext ? Math.round((xpInfo.xpIntoLevel / (xpInfo.xpIntoLevel + xpInfo.xpNeededForNext)) * 100) : 100;

  return (
    <div className="flex flex-col gap-6 max-w-2xl pb-20 md:pb-0">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full overflow-hidden bg-[#111111] grid place-items-center flex-none">
          {renderAvatarSvg(avatarConfig, user.currentPhase - 1, 56)}
        </div>
        {professionalMode ? (
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm">{user.name}</div>
            <div className="text-xs text-zinc-500">
              Phase {user.currentPhase}/{store.phases.length} — {phase?.key}
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold">Level {progress.level}</span>
                <span className="text-zinc-500">{rank}</span>
              </div>
              <div className="h-2 rounded-full bg-zinc-200 overflow-hidden mt-1">
                <div className="h-full bg-[#ff6b00]" style={{ width: `${xpPct}%` }} />
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">{progress.xp} XP</div>
            </div>
            <div className="text-sm font-semibold text-orange-600 flex-none">🔥 {progress.streak}</div>
          </>
        )}
      </div>

      <a
        href={nextMissionLink}
        className="block rounded-2xl bg-[#ff6b00] text-[#111111] font-bold text-lg p-5 text-center shadow-sm"
      >
        {professionalMode ? "งานถัดไป" : "ภารกิจถัดไป"}
        <div className="text-base font-semibold mt-1">{nextMissionTitle}</div>
      </a>

      <div className="rounded-2xl border border-zinc-200 p-4">
        <h2 className="font-semibold mb-3">{professionalMode ? "งานวันนี้" : "Daily Missions"}</h2>
        <ul className="flex flex-col gap-3">
          {sortedMissions.map((m) => (
            <li key={m.id} className="flex items-center gap-3">
              <form action={completeDailyMissionAction.bind(null, m.id)}>
                <button
                  type="submit"
                  disabled={!!m.doneAt}
                  aria-label={m.doneAt ? "เสร็จแล้ว" : "ทำเครื่องหมายว่าเสร็จ"}
                  className={`w-6 h-6 rounded-full border flex-none grid place-items-center text-xs ${
                    m.doneAt ? "bg-green-600 border-green-600 text-white" : "border-zinc-400"
                  }`}
                >
                  {m.doneAt ? "✓" : ""}
                </button>
              </form>
              <span className={`flex-1 text-sm ${m.doneAt ? "line-through text-zinc-400" : ""}`}>{m.title}</span>
              {!professionalMode && <span className="text-xs text-zinc-400 flex-none">+{m.xp} XP</span>}
            </li>
          ))}
          {sortedMissions.length === 0 && <li className="text-sm text-zinc-500">วันนี้ไม่มีภารกิจใหม่ ทำดีมากแล้ว!</li>}
        </ul>
      </div>

      <div className="rounded-2xl border border-zinc-200 p-4">
        <h2 className="font-semibold mb-3">เส้นทางสู่ UM</h2>
        <div className="flex gap-1">
          {store.phases.map((p) => (
            <div
              key={p.id}
              title={p.key}
              className={`flex-1 h-2 rounded-full ${
                p.no < user.currentPhase ? "bg-[#111111]" : p.no === user.currentPhase ? "bg-[#ff6b00]" : "bg-zinc-200"
              }`}
            />
          ))}
        </div>
        <div className="text-xs text-zinc-500 mt-2">
          Phase {user.currentPhase}/{store.phases.length} — {phase?.key}
        </div>
      </div>

      {phase && (
        <div className="rounded-2xl border border-zinc-200 p-4">
          <h2 className="font-semibold mb-2">{professionalMode ? `Gate Checklist — ${phase.gate.name}` : phase.gate.name}</h2>
          <div className="h-3 rounded-full bg-zinc-200 overflow-hidden">
            <div className={`h-full ${professionalMode ? "bg-zinc-700" : "bg-red-500"}`} style={{ width: `${gateReqs.length ? Math.round((gateOk / gateReqs.length) * 100) : 0}%` }} />
          </div>
          <div className="text-xs text-zinc-500 mt-1">
            ผ่านแล้ว {gateOk}/{gateReqs.length} ข้อ
          </div>
        </div>
      )}

      {!professionalMode && (
        <div className="rounded-2xl border border-zinc-200 p-4">
          <h2 className="font-semibold mb-3">Kudos ล่าสุด</h2>
          {recentKudos.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center">ยังไม่มี Kudos — ทำภารกิจต่อไปเพื่อให้โค้ชเห็นความก้าวหน้า!</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {recentKudos.map((k) => (
                <li key={k.id} className="text-sm">
                  <span className="font-medium">{k.from.name}</span>
                  <span className="text-zinc-500">: {k.message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
