import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWeeklyLeaderboard } from "@/lib/data/leaderboard";
import { checkAndCompleteTeamChallenge, getActiveTeamChallenge, TEAM_CHALLENGE_METRICS } from "@/lib/data/team-expedition";
import { loadStoreForUser } from "@/lib/data/load-store";
import { riskLevel } from "@/lib/domain/risk";
import { DEFAULT_AVATAR_CONFIG, renderAvatarSvg, type AvatarConfig } from "@/lib/avatar";
import { approveGateAction, createTeamExpeditionAction, needsDevGateAction, sendKudosAction } from "./actions";

const RISK_DOT = { green: "bg-green-500", amber: "bg-amber-500", red: "bg-red-500" } as const;

export default async function TeamPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const isReviewer = session.user.role === "al" || session.user.role === "admin";
  const isGuildLeader = session.user.role === "coach" || session.user.role === "al" || session.user.role === "admin";

  const [leaderboard, roster, activeChallenge] = await Promise.all([
    dbUser.cohortId && !dbUser.professionalMode ? getWeeklyLeaderboard(prisma, dbUser.cohortId, userId) : null,
    dbUser.cohortId ? prisma.user.findMany({ where: { cohortId: dbUser.cohortId, id: { not: userId } }, orderBy: { name: "asc" } }) : [],
    dbUser.cohortId ? getActiveTeamChallenge(prisma, dbUser.cohortId) : null,
  ]);
  const expedition = activeChallenge ? await checkAndCompleteTeamChallenge(prisma, activeChallenge) : null;

  const pending = isReviewer
    ? await prisma.gateReview.findMany({
        where: { status: "requested" },
        include: { user: true, gate: { include: { phase: true } } },
        orderBy: { requestedAt: "asc" },
      })
    : [];

  // Guild Dashboard (§6): coach sees their assignees, AL sees their team, admin sees everyone.
  const guildMembers = isGuildLeader
    ? await prisma.user.findMany({
        where: {
          role: "um",
          ...(session.user.role === "coach" ? { coachId: userId } : session.user.role === "al" ? { alId: userId } : {}),
        },
        orderBy: { name: "asc" },
      })
    : [];
  const guildCards = await Promise.all(
    guildMembers.map(async (m) => {
      const [progress, store] = await Promise.all([
        prisma.userProgress.findUnique({ where: { userId: m.id } }),
        loadStoreForUser(prisma, m.id),
      ]);
      const phase = store.phases.find((p) => p.no === m.currentPhase);
      const avatarConfig = (m.avatarConfig as AvatarConfig | null) ?? DEFAULT_AVATAR_CONFIG;
      return {
        id: m.id,
        name: m.name,
        avatarConfig,
        level: progress?.level ?? 1,
        streak: progress?.streak ?? 0,
        phaseKey: phase?.key ?? "-",
        risk: riskLevel(store, m.id),
      };
    })
  );

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Team</h1>

      {isGuildLeader && (
        <div className="rounded-2xl border border-zinc-200 p-4">
          <h2 className="font-semibold mb-3">Guild Dashboard ({guildCards.length})</h2>
          {guildCards.length === 0 ? (
            <p className="text-sm text-zinc-500">ยังไม่มี Future UM ที่คุณดูแล</p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {guildCards.map((m) => (
                <Link key={m.id} href={`/team/${m.id}`} className="rounded-xl border border-zinc-200 p-3 flex items-center gap-3 hover:border-zinc-300">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-[#111111] grid place-items-center flex-none">
                    {renderAvatarSvg(m.avatarConfig, 0, 40)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{m.name}</div>
                    <div className="text-xs text-zinc-500">
                      Lv.{m.level} · 🔥{m.streak} · {m.phaseKey}
                    </div>
                  </div>
                  <span className={`w-2.5 h-2.5 rounded-full flex-none ${RISK_DOT[m.risk]}`} aria-label={`risk: ${m.risk}`} />
                </Link>
              ))}
            </ul>
          )}
        </div>
      )}

      {isReviewer && (
        <div className="rounded-2xl border border-zinc-200 p-4">
          <h2 className="font-semibold mb-3">สร้าง Team Expedition</h2>
          <form action={createTeamExpeditionAction} className="flex flex-col gap-2">
            <input name="title" required placeholder="ชื่อภารกิจ เช่น ทั้งทีมสัมภาษณ์รวม 30 คน" className="border border-zinc-300 rounded-lg px-2 py-1.5 text-sm" />
            <div className="grid grid-cols-3 gap-2">
              <select name="metric" className="border border-zinc-300 rounded-lg px-2 py-1.5 text-sm">
                {TEAM_CHALLENGE_METRICS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <input name="target" type="number" min={1} required placeholder="เป้าหมาย" className="border border-zinc-300 rounded-lg px-2 py-1.5 text-sm" />
              <input name="xpReward" type="number" min={1} required placeholder="XP รางวัล" className="border border-zinc-300 rounded-lg px-2 py-1.5 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-zinc-500 flex flex-col gap-1">
                เริ่ม
                <input name="startAt" type="date" required className="border border-zinc-300 rounded-lg px-2 py-1.5 text-sm" />
              </label>
              <label className="text-xs text-zinc-500 flex flex-col gap-1">
                สิ้นสุด
                <input name="endAt" type="date" required className="border border-zinc-300 rounded-lg px-2 py-1.5 text-sm" />
              </label>
            </div>
            <button type="submit" className="rounded-lg bg-[#1e7a48] text-white font-semibold py-2 mt-1">
              สร้าง Team Expedition
            </button>
          </form>
        </div>
      )}

      {leaderboard?.enabled && (
        <div className="rounded-2xl border border-zinc-200 p-4">
          <h2 className="font-semibold mb-3">Leaderboard สัปดาห์นี้</h2>
          <ol className="flex flex-col gap-2 text-sm">
            {leaderboard.top.map((e) => (
              <li key={e.userId} className={`flex justify-between ${e.userId === userId ? "font-semibold text-[#b84c00]" : ""}`}>
                <span>
                  #{e.rank} {e.name}
                </span>
                <span>{e.weeklyXp} XP</span>
              </li>
            ))}
          </ol>
          {leaderboard.self && leaderboard.self.rank > 5 && (
            <div className="mt-3 pt-3 border-t border-zinc-100 text-sm font-semibold text-[#b84c00]">
              อันดับของคุณ: #{leaderboard.self.rank} — {leaderboard.self.weeklyXp} XP
            </div>
          )}
          <p className="text-xs text-zinc-400 mt-2">รีเซ็ตทุกวันจันทร์ — จัดอันดับจาก XP ความพยายาม ไม่ใช่ยอดขาย</p>
        </div>
      )}

      {expedition && (
        <div className="rounded-2xl border border-zinc-200 p-4">
          <h2 className="font-semibold mb-2">Team Expedition: {expedition.challenge.title}</h2>
          <div className="h-3 rounded-full bg-zinc-200 overflow-hidden">
            <div
              className="h-full bg-[#1e7a48]"
              style={{ width: `${Math.min(100, Math.round((expedition.actual / expedition.challenge.target) * 100))}%` }}
            />
          </div>
          <div className="text-xs text-zinc-500 mt-1">
            {expedition.actual}/{expedition.challenge.target} · รางวัล +{expedition.challenge.xpReward} XP ทุกคนเมื่อสำเร็จ
          </div>
          {expedition.challenge.completedAt && <div className="text-sm text-green-700 font-medium mt-2">🎉 สำเร็จแล้ว! XP แจกให้ทุกคนแล้ว</div>}
        </div>
      )}

      {roster.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 p-4">
          <h2 className="font-semibold mb-3">เพื่อนร่วม Cohort</h2>
          <ul className="flex flex-col gap-3">
            {roster.map((u) => (
              <li key={u.id} className="rounded-xl border border-zinc-200 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{u.name}</span>
                  <span className="text-xs text-zinc-400">{u.role}</span>
                </div>
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-[#b84c00]">ส่ง Kudos</summary>
                  <form action={sendKudosAction.bind(null, u.id)} className="flex gap-2 mt-2">
                    <input name="message" placeholder="ข้อความให้กำลังใจสั้น ๆ" className="flex-1 border border-zinc-300 rounded-lg px-2 py-1 text-sm" />
                    <button type="submit" className="px-3 py-1.5 rounded-full bg-[#ff6b00] text-[#111111] text-sm font-medium">
                      ส่ง
                    </button>
                  </form>
                </details>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isReviewer && (
        <div className="rounded-2xl border border-zinc-200 p-4">
          <h2 className="font-semibold mb-3">คำขอรีวิว Gate ({pending.length})</h2>
          {pending.length === 0 && <p className="text-sm text-zinc-500">ยังไม่มีคำขอรีวิว Gate</p>}
          <ul className="flex flex-col gap-4">
            {pending.map((r) => (
              <li key={r.id} className="rounded-xl border border-zinc-200 p-3">
                <div className="font-medium text-sm">
                  {r.user.name} — {r.gate.phase.key} ({r.gate.name})
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">ขอเมื่อ {r.requestedAt.toISOString().slice(0, 16).replace("T", " ")}</div>
                <div className="flex items-center gap-2 mt-3">
                  <form action={approveGateAction.bind(null, r.id)}>
                    <button type="submit" className="px-3 py-1.5 rounded-full bg-green-600 text-white text-sm font-medium">
                      อนุมัติ
                    </button>
                  </form>
                  <details className="flex-1">
                    <summary className="cursor-pointer text-sm text-amber-700">ขอพัฒนาเพิ่ม</summary>
                    <form action={needsDevGateAction.bind(null, r.id)} className="flex gap-2 mt-2">
                      <input name="comment" placeholder="คำแนะนำสั้น ๆ" className="flex-1 border border-zinc-300 rounded-lg px-2 py-1 text-sm" />
                      <button type="submit" className="px-3 py-1.5 rounded-full border border-amber-400 text-amber-700 text-sm font-medium">
                        ส่ง
                      </button>
                    </form>
                  </details>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-zinc-400">สรุปทีมแบบรวม (Total/Ready/At Risk) และตาราง roster เต็มรูปแบบ (V1 §19) ลงในสปรินต์ QA ถัดไป</p>
    </div>
  );
}
