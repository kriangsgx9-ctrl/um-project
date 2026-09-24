import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { loadStoreForUser } from "@/lib/data/load-store";
import { curPhase, userById } from "@/lib/domain/actions";
import { gateRequirements } from "@/lib/domain/gate";
import { risks, riskLevel } from "@/lib/domain/risk";
import { DEFAULT_AVATAR_CONFIG, renderAvatarSvg, type AvatarConfig } from "@/lib/avatar";
import { EvidenceReviewCard } from "@/components/EvidenceReviewCard";
import { assignCoachQuestAction, requireGuildAccess } from "./actions";

const RISK_STYLE = {
  green: { bg: "bg-green-50 border-green-200 text-green-800", label: "ปกติ" },
  amber: { bg: "bg-amber-50 border-amber-200 text-amber-800", label: "เฝ้าระวัง" },
  red: { bg: "bg-red-50 border-red-200 text-red-800", label: "ต้องช่วยด่วน" },
} as const;

export default async function GuildMemberPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId: targetUserId } = await params;

  let target;
  try {
    ({ target } = await requireGuildAccess(targetUserId));
  } catch {
    redirect("/team");
  }

  const store = await loadStoreForUser(prisma, targetUserId);
  const user = userById(store, targetUserId)!;
  const phase = curPhase(store, user);
  const gateReqs = phase ? gateRequirements(store, user, phase) : [];
  const gateOk = gateReqs.filter((r) => r.ok).length;
  const riskSignals = risks(store, targetUserId);
  const level = riskLevel(store, targetUserId);
  const avatarConfig = (target.avatarConfig as AvatarConfig | null) ?? DEFAULT_AVATAR_CONFIG;
  const pendingEvidence = store.evidence.filter((e) => e.status === "submitted");

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full overflow-hidden bg-[#111111] grid place-items-center flex-none">
          {renderAvatarSvg(avatarConfig, user.currentPhase - 1, 56)}
        </div>
        <div>
          <h1 className="text-xl font-bold">{user.name}</h1>
          <div className="text-sm text-zinc-500">
            {user.code} · Phase {user.currentPhase}/{store.phases.length} — {phase?.key}
          </div>
        </div>
      </div>

      {/* Risk Radar — deliberately serious, no game elements, per §6 */}
      <div className="rounded-2xl border border-zinc-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Risk Radar</h2>
          <span className={`text-xs font-medium px-2 py-1 rounded-full border ${RISK_STYLE[level].bg}`}>{RISK_STYLE[level].label}</span>
        </div>
        {riskSignals.length === 0 ? (
          <p className="text-sm text-zinc-500">ไม่มีสัญญาณความเสี่ยงในขณะนี้</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {riskSignals.map((r) => (
              <li key={r.key} className={`rounded-lg border p-3 text-sm ${RISK_STYLE[r.lvl].bg}`}>
                <div className="font-medium">{r.title}</div>
                <div className="mt-0.5">{r.detail}</div>
                <div className="text-xs mt-1 opacity-80">แนะนำ: {r.rec}</div>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-zinc-400 mt-3">สัญญาณการพัฒนา ไม่ใช่การตัดสินการเลื่อนตำแหน่งอัตโนมัติ</p>
      </div>

      <div className="rounded-2xl border border-zinc-200 p-4">
        <h2 className="font-semibold mb-2">Gate Checklist — {phase?.gate.name}</h2>
        <ul className="flex flex-col gap-1 text-sm">
          {gateReqs.map((r) => (
            <li key={r.id} className={r.ok ? "text-green-700" : "text-zinc-500"}>
              {r.ok ? "✓" : "○"} {r.title}
            </li>
          ))}
        </ul>
        <div className="text-xs text-zinc-500 mt-2">
          {gateOk}/{gateReqs.length} ข้อ
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 p-4">
        <h2 className="font-semibold mb-3">Evidence Review Queue ({pendingEvidence.length})</h2>
        {pendingEvidence.length === 0 ? (
          <p className="text-sm text-zinc-500">ไม่มีหลักฐานรอรีวิว</p>
        ) : (
          <div className="flex flex-col gap-4">
            {pendingEvidence.map((e) => {
              const action = store.actions.find((a) => a.id === e.actionId);
              return (
                <EvidenceReviewCard
                  key={e.id}
                  targetUserId={targetUserId}
                  evidenceId={e.id}
                  title={action?.title ?? "หลักฐาน"}
                  description=""
                  date={e.createdAt.slice(0, 10)}
                />
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-200 p-4">
        <h2 className="font-semibold mb-3">มอบหมาย Coach Quest</h2>
        <form action={assignCoachQuestAction.bind(null, targetUserId)} className="flex flex-col gap-2">
          <input name="title" required placeholder="ชื่อภารกิจ" className="border border-zinc-300 rounded-lg px-2 py-1.5 text-sm" />
          <textarea name="description" placeholder="รายละเอียด (ถ้ามี)" rows={2} className="border border-zinc-300 rounded-lg px-2 py-1.5 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-zinc-500 flex flex-col gap-1">
              กำหนดส่ง (วัน)
              <input name="dueInDays" type="number" min={1} defaultValue={7} className="border border-zinc-300 rounded-lg px-2 py-1.5 text-sm" />
            </label>
            <label className="text-xs text-zinc-500 flex flex-col gap-1">
              XP โบนัส (0-100)
              <input name="bonusXp" type="number" min={0} max={100} defaultValue={20} className="border border-zinc-300 rounded-lg px-2 py-1.5 text-sm" />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-600">
            <input type="checkbox" name="requireEvidence" /> ต้องส่งหลักฐาน
          </label>
          <button type="submit" className="rounded-lg bg-[#ff6b00] text-[#111111] font-semibold py-2 mt-1">
            มอบหมายภารกิจ
          </button>
        </form>
      </div>
    </div>
  );
}
