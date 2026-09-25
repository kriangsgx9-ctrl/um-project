import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadStoreForUser } from "@/lib/data/load-store";
import { dueDate, phaseById, ua, userById } from "@/lib/domain/actions";
import { ActionDetailControls } from "@/components/Actions/ActionDetailControls";

export default async function ActionDetailPage({ params }: { params: Promise<{ actionId: string }> }) {
  const { actionId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const store = await loadStoreForUser(prisma, userId);
  const user = userById(store, userId)!;
  const action = store.actions.find((a) => a.id === actionId);
  if (!action) notFound();

  const phase = phaseById(store, action.phaseId);
  const userAction = ua(store, userId, action.id);
  const competency = action.competencyId ? store.competencies.find((c) => c.id === action.competencyId) : null;
  const coach = user.coachId ? await prisma.user.findUnique({ where: { id: user.coachId }, select: { name: true } }) : null;

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div>
        <Link href="/actions" className="text-xs text-zinc-400 hover:underline">
          ← กลับไป Actions
        </Link>
        <div className="text-xs text-zinc-400 uppercase tracking-wide mt-2">
          {phase?.key} · {action.category}
        </div>
        <h1 className="text-2xl font-bold mt-1">{action.title}</h1>
      </div>

      <div className="rounded-2xl border border-zinc-200 p-4 shadow-card flex flex-col gap-3">
        <div>
          <h2 className="font-semibold text-sm mb-1">พันธกิจ</h2>
          <p className="text-sm text-zinc-600">{action.desc}</p>
        </div>
        {action.why && (
          <div>
            <h2 className="font-semibold text-sm mb-1">ทำไมถึงสำคัญ</h2>
            <p className="text-sm text-zinc-600">{action.why}</p>
          </div>
        )}
        {action.steps.length > 0 && (
          <div>
            <h2 className="font-semibold text-sm mb-1">ขั้นตอน</h2>
            <ul className="list-disc list-inside text-sm text-zinc-600 flex flex-col gap-0.5">
              {action.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}
        {action.success.length > 0 && (
          <div>
            <h2 className="font-semibold text-sm mb-1">เกณฑ์ความสำเร็จ</h2>
            <ul className="list-disc list-inside text-sm text-zinc-600 flex flex-col gap-0.5">
              {action.success.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        <dl className="grid grid-cols-2 gap-3 text-sm pt-2 border-t border-zinc-100">
          <div>
            <dt className="text-xs text-zinc-400">กำหนดส่ง</dt>
            <dd>{dueDate(user, action)}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-400">ความสำคัญ</dt>
            <dd className="capitalize">{action.priority}</dd>
          </div>
          {competency && (
            <div>
              <dt className="text-xs text-zinc-400">Competency ที่เกี่ยวข้อง</dt>
              <dd>{competency.name}</dd>
            </div>
          )}
          {coach && (
            <div>
              <dt className="text-xs text-zinc-400">โค้ช</dt>
              <dd>{coach.name}</dd>
            </div>
          )}
          {action.evidence && action.evidenceHint && (
            <div className="col-span-2">
              <dt className="text-xs text-zinc-400">หลักฐานที่ต้องส่ง</dt>
              <dd>{action.evidenceHint}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="rounded-2xl border border-zinc-200 p-4 shadow-card">
        <h2 className="font-semibold mb-3">การดำเนินการ</h2>
        <ActionDetailControls actionId={action.id} status={userAction.status} requiresEvidence={action.evidence} />
      </div>

      {userAction.history.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 p-4 shadow-card">
          <h2 className="font-semibold mb-3">ประวัติกิจกรรม</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {[...userAction.history].reverse().map((h, i) => (
              <li key={i} className="text-zinc-600">
                <span className="text-xs text-zinc-400">{h.at.slice(0, 16).replace("T", " ")}</span> — {h.text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
