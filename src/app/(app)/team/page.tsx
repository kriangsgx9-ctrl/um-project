import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWeeklyLeaderboard } from "@/lib/data/leaderboard";
import { checkAndCompleteTeamChallenge, getActiveTeamChallenge } from "@/lib/data/team-expedition";
import { approveGateAction, needsDevGateAction, sendKudosAction } from "./actions";

export default async function TeamPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const isReviewer = session.user.role === "al" || session.user.role === "admin";

  const [leaderboard, roster, activeChallenge] = await Promise.all([
    dbUser.cohortId ? getWeeklyLeaderboard(prisma, dbUser.cohortId, userId) : null,
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

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Team</h1>

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

      <p className="text-xs text-zinc-400">Coach/Team Dashboard เต็มรูปแบบ (V1 §19, risk radar ฯลฯ) ลงในสปรินต์ถัดไป</p>
    </div>
  );
}
