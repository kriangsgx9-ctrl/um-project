import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadStoreForUser } from "@/lib/data/load-store";
import { funnelCounts, STAGES } from "@/lib/domain/funnel";
import { CandidateCard } from "@/components/Recruitment/CandidateCard";
import { addCandidateAction } from "./actions";

export default async function RecruitmentPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [store, candidates] = await Promise.all([
    loadStoreForUser(prisma, userId),
    prisma.candidate.findMany({ where: { ownerId: userId }, orderBy: { updatedAt: "desc" } }),
  ]);
  const counts = funnelCounts(store, userId);

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Recruitment</h1>

      <div className="rounded-2xl border border-zinc-200 p-4 shadow-card">
        <h2 className="font-semibold mb-3">Funnel</h2>
        <div className="flex flex-col gap-1.5">
          {STAGES.map((s, i) => {
            const conversion = i === 0 || counts[i - 1] === 0 ? 100 : Math.round((counts[i] / counts[i - 1]) * 100);
            const widthPct = counts[0] > 0 ? Math.max(4, Math.round((counts[i] / counts[0]) * 100)) : 0;
            return (
              <div key={s.k} className="flex items-center gap-3">
                <div className="w-24 text-xs text-zinc-500 flex-none">{s.th}</div>
                <div className="flex-1 h-6 rounded-md bg-zinc-100 overflow-hidden">
                  <div className="h-full bg-[#ff6b00]" style={{ width: `${widthPct}%` }} />
                </div>
                <div className="w-20 text-right text-xs text-zinc-500 flex-none">
                  {counts[i]} คน{i > 0 && <span className="text-zinc-400"> · {conversion}%</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 p-4 shadow-card">
        <h2 className="font-semibold mb-3">เพิ่มผู้สมัคร</h2>
        <form action={addCandidateAction} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input name="name" required aria-label="ชื่อผู้สมัคร" placeholder="ชื่อผู้สมัคร" className="border border-zinc-300 rounded-lg px-2 py-1.5 text-sm" />
          <input name="phone" aria-label="เบอร์ติดต่อ" placeholder="เบอร์ติดต่อ" className="border border-zinc-300 rounded-lg px-2 py-1.5 text-sm" />
          <input name="source" aria-label="แหล่งที่มา" placeholder="แหล่งที่มา เช่น Natural market" className="border border-zinc-300 rounded-lg px-2 py-1.5 text-sm" />
          <button type="submit" className="sm:col-span-3 rounded-lg bg-[#ff6b00] text-[#111111] font-semibold py-2">
            เพิ่มผู้สมัคร
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-zinc-200 p-4 shadow-card">
        <h2 className="font-semibold mb-3">ผู้สมัครทั้งหมด ({candidates.length})</h2>
        {candidates.length === 0 ? (
          <p className="text-sm text-zinc-500">ยังไม่มีผู้สมัครในระบบ</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {candidates.map((c) => (
              <CandidateCard
                key={c.id}
                candidate={{
                  id: c.id,
                  name: c.name,
                  phone: c.phone,
                  source: c.source,
                  stage: c.stage,
                  status: c.status,
                  nextAction: c.nextAction,
                  nextActionDate: c.nextActionDate ? c.nextActionDate.toISOString().slice(0, 10) : null,
                  notes: c.notes,
                  updatedAt: c.updatedAt.toISOString(),
                }}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
