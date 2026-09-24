import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { approveGateAction, needsDevGateAction } from "./actions";

export default async function TeamPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  if (session.user.role !== "al" && session.user.role !== "admin") {
    return (
      <div>
        <h1 className="text-2xl font-bold">Team</h1>
        <p className="text-zinc-500 mt-2">หน้านี้สำหรับ AL/Admin — Coach/Team Dashboard เต็มรูปแบบ (V1 §19) ลงในสปรินต์ถัดไป</p>
      </div>
    );
  }

  const pending = await prisma.gateReview.findMany({
    where: { status: "requested" },
    include: { user: true, gate: { include: { phase: true } } },
    orderBy: { requestedAt: "asc" },
  });

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Team</h1>
        <p className="text-zinc-500 mt-2 text-sm">Gate Review queue — Team Dashboard เต็มรูปแบบ (V1 §19) ลงในสปรินต์ถัดไป</p>
      </div>

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
    </div>
  );
}
