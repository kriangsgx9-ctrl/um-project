import Link from "next/link";
import { redirect } from "next/navigation";
import { UsersRound } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWeeklyLeaderboard } from "@/lib/data/leaderboard";
import { checkAndCompleteTeamChallenge, getActiveTeamChallenge, TEAM_CHALLENGE_METRICS } from "@/lib/data/team-expedition";
import { loadStoreForUser } from "@/lib/data/load-store";
import { curPhase, isUMReady, userById } from "@/lib/domain/actions";
import { ago, diffDays, today } from "@/lib/domain/dates";
import { gateStatus } from "@/lib/domain/gate";
import { lastActivity, risks, riskLevel } from "@/lib/domain/risk";
import { readiness } from "@/lib/domain/readiness";
import { DEFAULT_AVATAR_CONFIG, renderAvatarSvg, type AvatarConfig } from "@/lib/avatar";
import { KudosForm } from "@/components/KudosForm";
import { PageHeader } from "@/components/PageHeader";
import { approveGateAction, createTeamExpeditionAction, needsDevGateAction } from "./actions";

// V2 §6: the Guild/Command-Center view must never show game elements
// (XP/Level/Streak/badges) — only serious data, hence no Lv./🔥 here.
const RISK_STYLE = {
  green: { bg: "bg-green-50 border-green-200 text-green-800", label: "ปกติ" },
  amber: { bg: "bg-amber-50 border-amber-200 text-amber-800", label: "เฝ้าระวัง" },
  red: { bg: "bg-red-50 border-red-200 text-red-800", label: "ต้องช่วยด่วน" },
} as const;

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
      const store = await loadStoreForUser(prisma, m.id);
      const phase = store.phases.find((p) => p.no === m.currentPhase);
      const avatarConfig = (m.avatarConfig as AvatarConfig | null) ?? DEFAULT_AVATAR_CONFIG;
      const memberUser = userById(store, m.id)!;
      const ready = isUMReady(store, memberUser);
      const gateSignal = risks(store, m.id).find((r) => r.key === "gate");
      const p = curPhase(store, memberUser);
      return {
        id: m.id,
        name: m.name,
        avatarConfig,
        phaseKey: phase?.key ?? "-",
        dayInProgram: Math.max(1, diffDays(today(), memberUser.startDate) + 1),
        readinessScore: readiness(store, m.id).total,
        gateName: ready ? "UM READY" : (p?.gate.name ?? "-"),
        gateStatusLabel: ready || !p ? "" : gateStatus(store, memberUser, p).l,
        risk: riskLevel(store, m.id),
        lastActivityLabel: ago(lastActivity(store, m.id)),
        ready,
        gateUpcoming: gateSignal?.lvl === "amber",
      };
    })
  );

  // V1 §19 command-center summary cards. "Current Gate" counts members with an
  // active (awaiting-review) Gate challenge right now; "Upcoming Gates" counts
  // members whose gate deadline is close per the same signal risk.ts already
  // computes for the Risk Radar (§20), so the two numbers never disagree.
  const activeGateReviews = guildMembers.length
    ? await prisma.gateReview.count({ where: { userId: { in: guildMembers.map((m) => m.id) }, status: "requested" } })
    : 0;
  const teamStats = {
    total: guildCards.length,
    ready: guildCards.filter((c) => c.ready).length,
    developing: guildCards.filter((c) => !c.ready && c.risk === "green").length,
    atRisk: guildCards.filter((c) => !c.ready && c.risk !== "green").length,
    currentGate: activeGateReviews,
    upcomingGates: guildCards.filter((c) => c.gateUpcoming).length,
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <PageHeader icon={UsersRound}>Team</PageHeader>

      {isGuildLeader && (
        <div className="rounded-2xl border border-zinc-200 p-4 shadow-card">
          <h2 className="font-semibold mb-3">Guild Dashboard ({guildCards.length})</h2>

          {guildCards.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="rounded-xl border border-zinc-200 p-2 text-center">
                <div className="text-xl font-bold">{teamStats.total}</div>
                <div className="text-[11px] text-zinc-500">Total</div>
              </div>
              <div className="rounded-xl border border-zinc-200 p-2 text-center">
                <div className="text-xl font-bold text-green-700">{teamStats.ready}</div>
                <div className="text-[11px] text-zinc-500">Ready</div>
              </div>
              <div className="rounded-xl border border-zinc-200 p-2 text-center">
                <div className="text-xl font-bold">{teamStats.developing}</div>
                <div className="text-[11px] text-zinc-500">Developing</div>
              </div>
              <div className="rounded-xl border border-zinc-200 p-2 text-center">
                <div className="text-xl font-bold text-amber-700">{teamStats.atRisk}</div>
                <div className="text-[11px] text-zinc-500">At Risk</div>
              </div>
              <div className="rounded-xl border border-zinc-200 p-2 text-center">
                <div className="text-xl font-bold">{teamStats.currentGate}</div>
                <div className="text-[11px] text-zinc-500">Current Gate</div>
              </div>
              <div className="rounded-xl border border-zinc-200 p-2 text-center">
                <div className="text-xl font-bold">{teamStats.upcomingGates}</div>
                <div className="text-[11px] text-zinc-500">Upcoming Gates</div>
              </div>
            </div>
          )}

          {guildCards.length === 0 ? (
            <p className="text-sm text-zinc-500">ยังไม่มี Future UM ที่คุณดูแล</p>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left text-xs text-zinc-400 border-b border-zinc-200">
                    <th className="py-2 pr-3 font-medium">Name</th>
                    <th className="py-2 pr-3 font-medium">Phase</th>
                    <th className="py-2 pr-3 font-medium">Readiness</th>
                    <th className="py-2 pr-3 font-medium">Gate</th>
                    <th className="py-2 pr-3 font-medium">Risk</th>
                    <th className="py-2 pr-3 font-medium">Last Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {guildCards.map((m) => (
                    <tr key={m.id} className="border-b border-zinc-100 last:border-0">
                      <td className="py-2 pr-3">
                        <Link href={`/team/${m.id}`} className="flex items-center gap-2 min-w-[160px] hover:underline">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-[#111111] grid place-items-center flex-none">
                            {renderAvatarSvg(m.avatarConfig, 0, 32)}
                          </div>
                          <span className="font-medium truncate">{m.name}</span>
                        </Link>
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {m.ready ? "UM READY" : m.phaseKey}
                        <div className="text-xs text-zinc-400">Day {m.dayInProgram}</div>
                      </td>
                      <td className="py-2 pr-3 font-medium tabular-nums">{m.readinessScore}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {m.gateName}
                        {m.gateStatusLabel && <div className="text-xs text-zinc-400">{m.gateStatusLabel}</div>}
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${RISK_STYLE[m.risk].bg}`}>{RISK_STYLE[m.risk].label}</span>
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap text-zinc-500">{m.lastActivityLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {isReviewer && (
        <div className="rounded-2xl border border-zinc-200 p-4 shadow-card">
          <h2 className="font-semibold mb-3">สร้าง Team Expedition</h2>
          <form action={createTeamExpeditionAction} className="flex flex-col gap-2">
            <input
              name="title"
              required
              aria-label="ชื่อภารกิจ"
              placeholder="ชื่อภารกิจ เช่น ทั้งทีมสัมภาษณ์รวม 30 คน"
              className="border border-zinc-300 rounded-lg px-2 py-1.5 text-sm"
            />
            <div className="grid grid-cols-3 gap-2">
              <select name="metric" aria-label="ตัวชี้วัด" className="border border-zinc-300 rounded-lg px-2 py-1.5 text-sm">
                {TEAM_CHALLENGE_METRICS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <input name="target" type="number" min={1} required aria-label="เป้าหมาย" placeholder="เป้าหมาย" className="border border-zinc-300 rounded-lg px-2 py-1.5 text-sm" />
              <input name="xpReward" type="number" min={1} required aria-label="XP รางวัล" placeholder="XP รางวัล" className="border border-zinc-300 rounded-lg px-2 py-1.5 text-sm" />
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
        <div className="rounded-2xl border border-zinc-200 p-4 shadow-card">
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
        <div className="rounded-2xl border border-zinc-200 p-4 shadow-card">
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
        <div className="rounded-2xl border border-zinc-200 p-4 shadow-card">
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
                  <KudosForm toUserId={u.id} toName={u.name} />
                </details>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isReviewer && (
        <div className="rounded-2xl border border-zinc-200 p-4 shadow-card">
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
                      <input name="comment" aria-label="คำแนะนำสำหรับ Gate นี้" placeholder="คำแนะนำสั้น ๆ" className="flex-1 border border-zinc-300 rounded-lg px-2 py-1 text-sm" />
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
    </div>
  );
}
