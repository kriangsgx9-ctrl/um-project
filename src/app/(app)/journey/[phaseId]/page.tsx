import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadStoreForUser } from "@/lib/data/load-store";
import { DONE, userById } from "@/lib/domain/actions";
import { gateRequirements, gateStatus } from "@/lib/domain/gate";
import { VictoryOverlay } from "@/components/VictoryOverlay";
import { DEFAULT_AVATAR_CONFIG, type AvatarConfig } from "@/lib/avatar";
import { acknowledgeVictoryAction, requestGateReviewAction } from "./actions";

export default async function ZoneDetailPage({ params }: { params: Promise<{ phaseId: string }> }) {
  const { phaseId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [store, dbUser] = await Promise.all([loadStoreForUser(prisma, userId), prisma.user.findUniqueOrThrow({ where: { id: userId } })]);
  const user = userById(store, userId)!;
  const phase = store.phases.find((p) => p.id === phaseId);
  if (!phase) notFound();

  const gate = await prisma.gate.findUnique({ where: { phaseId } });
  const reqs = gateRequirements(store, user, phase);
  const status = gateStatus(store, user, phase);
  const okCount = reqs.filter((r) => r.ok).length;
  const hpPct = reqs.length ? Math.round((okCount / reqs.length) * 100) : 0;

  const unseenVictory = gate
    ? await prisma.gateReview.findFirst({ where: { userId, gateId: gate.id, status: "approved", acknowledgedAt: null } })
    : null;

  const phaseActions = store.actions.filter((a) => a.phaseId === phaseId);

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      {unseenVictory && !dbUser.professionalMode && (
        <VictoryOverlay
          gateReviewId={unseenVictory.id}
          gateName={phase.gate.name}
          name={user.name}
          avatarConfig={(dbUser.avatarConfig as AvatarConfig | null) ?? DEFAULT_AVATAR_CONFIG}
          phasesPassed={user.currentPhase - 1}
        />
      )}
      {unseenVictory && dbUser.professionalMode && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 flex items-center justify-between">
          <span>ผ่าน {phase.gate.name} แล้ว</span>
          <form action={acknowledgeVictoryAction.bind(null, unseenVictory.id)}>
            <button type="submit" className="text-xs font-semibold underline">
              รับทราบ
            </button>
          </form>
        </div>
      )}

      <div>
        <div className="text-xs text-zinc-400 uppercase tracking-wide">
          Phase {phase.no}/{store.phases.length}
        </div>
        <h1 className="text-2xl font-bold">{phase.key}</h1>
        <p className="text-sm text-zinc-500 mt-1">{phase.objective}</p>
      </div>

      <div className="rounded-2xl border border-zinc-200 p-4 shadow-card">
        <h2 className="font-semibold mb-2">พันธกิจ</h2>
        <p className="text-sm text-zinc-600">{phase.mission}</p>
      </div>

      <div className="rounded-2xl border border-zinc-200 p-4 shadow-card">
        <h2 className="font-semibold mb-2">{dbUser.professionalMode ? `Gate Checklist — ${phase.gate.name}` : phase.gate.name}</h2>
        <div className="h-3 rounded-full bg-zinc-200 overflow-hidden">
          <div className={`h-full ${dbUser.professionalMode ? "bg-zinc-700" : "bg-red-500"}`} style={{ width: `${hpPct}%` }} />
        </div>
        <div className="text-xs text-zinc-500 mt-1">
          ผ่านแล้ว {okCount}/{reqs.length} ข้อ
        </div>

        <ul className="mt-3 flex flex-col gap-1 text-sm">
          {reqs.map((r) => (
            <li key={r.id} className={`flex items-center gap-2 ${r.ok ? "text-green-700" : "text-zinc-500"}`}>
              <span>{r.ok ? "✓" : "○"}</span>
              <span>{r.title}</span>
            </li>
          ))}
        </ul>

        {status.k === "needs_dev" && (
          <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
            AL ขอให้พัฒนาเพิ่มก่อนผ่าน Gate — ดูคำแนะนำที่ AL ให้ไว้
          </div>
        )}

        {status.k === "ready" && (
          <form action={requestGateReviewAction.bind(null, phaseId)} className="mt-3">
            <button type="submit" className="w-full rounded-lg bg-[#ff6b00] text-[#111111] font-semibold py-2">
              {dbUser.professionalMode ? `ขอรีวิว Gate Checklist` : `ท้าชิง ${phase.gate.name}`}
            </button>
          </form>
        )}
        {status.k === "requested" && <div className="mt-3 text-sm text-amber-600 font-medium">รอ AL รีวิว Gate</div>}
        {status.k === "passed" && (
          <div className="mt-3 text-sm text-green-700 font-medium">ผ่าน Gate แล้ว{!dbUser.professionalMode && " 🎉"}</div>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-200 p-4 shadow-card">
        <h2 className="font-semibold mb-3">Actions ในเฟสนี้</h2>
        <ul className="flex flex-col gap-2 text-sm">
          {phaseActions.map((a) => {
            const ua = store.userActions.find((x) => x.actionId === a.id);
            const done = ua && DONE.has(ua.status);
            return (
              <li key={a.id} className="flex items-center justify-between">
                <span className={done ? "line-through text-zinc-400" : ""}>{a.title}</span>
                <span className="text-xs text-zinc-400">{ua?.status ?? "not_started"}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
