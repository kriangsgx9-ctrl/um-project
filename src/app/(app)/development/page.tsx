import { redirect } from "next/navigation";
import { ClipboardList, GraduationCap, Handshake, Lightbulb, Target } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/PageHeader";

const CATEGORY_LABEL: Record<string, string> = {
  production: "Production",
  recruitment: "Recruitment",
  development: "Development",
  leadership: "Leadership",
  management: "Management",
};

const STATUS_LABEL: Record<string, string> = { not_started: "ยังไม่เริ่ม", in_progress: "กำลังทำ", waiting_review: "รอรีวิว", verified: "ยืนยันแล้ว", needs_revision: "ต้องแก้ไข", completed: "เสร็จแล้ว" };

export default async function DevelopmentPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [competencies, assessments, coaching, coachQuests] = await Promise.all([
    prisma.competency.findMany({ orderBy: { name: "asc" } }),
    prisma.competencyAssessment.findMany({ where: { userId }, orderBy: { assessedAt: "desc" } }),
    prisma.coachingSession.findMany({ where: { userId }, orderBy: { date: "desc" } }),
    prisma.action.findMany({ where: { assignedTo: userId }, include: { userActions: { where: { userId } } } }),
  ]);

  const latestScoreByCompetency = new Map<string, number>();
  for (const a of assessments) {
    if (!latestScoreByCompetency.has(a.competencyId)) latestScoreByCompetency.set(a.competencyId, a.score);
  }
  const byCategory = new Map<string, typeof competencies>();
  for (const c of competencies) {
    if (!byCategory.has(c.category)) byCategory.set(c.category, []);
    byCategory.get(c.category)!.push(c);
  }

  const latestFeedback = coaching.find((c) => c.kind === "received" && c.status === "completed" && c.feedback);

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <PageHeader icon={GraduationCap}>Development</PageHeader>

      {latestFeedback && (
        <div className="rounded-2xl border border-[#ffb800] bg-[#fff8e6] p-4 shadow-card">
          <h2 className="font-semibold mb-1 flex items-center gap-2">
            <Lightbulb size={16} className="text-[#8a6400]" />
            คำแนะนำล่าสุดจากโค้ช
          </h2>
          <p className="text-sm text-zinc-700">{latestFeedback.feedback}</p>
          <p className="text-xs text-zinc-400 mt-1">{latestFeedback.date.toISOString().slice(0, 10)} — {latestFeedback.topic}</p>
        </div>
      )}

      <div className="rounded-2xl border border-zinc-200 p-4 shadow-card">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <Target size={16} className="text-[#b84c00]" />
          Competency Matrix
        </h2>
        {competencies.length === 0 ? (
          <p className="text-sm text-zinc-500">ยังไม่มีข้อมูล Competency</p>
        ) : (
          <div className="flex flex-col gap-4">
            {Array.from(byCategory.entries()).map(([cat, list]) => (
              <div key={cat}>
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">{CATEGORY_LABEL[cat] ?? cat}</h3>
                <ul className="flex flex-col gap-1.5">
                  {list.map((c) => {
                    const score = latestScoreByCompetency.get(c.id);
                    return (
                      <li key={c.id} className="flex items-center justify-between gap-2 text-sm">
                        <span>{c.name}</span>
                        <span className="flex items-center gap-1 flex-none">
                          {score ? (
                            <span className="flex gap-0.5" aria-label={`ระดับ ${score} จาก 5`}>
                              {[1, 2, 3, 4, 5].map((i) => (
                                <span key={i} className={`w-2 h-2 rounded-full ${i <= score ? "bg-[#ff6b00]" : "bg-zinc-200"}`} />
                              ))}
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-400">ยังไม่ประเมิน</span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {coachQuests.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 p-4 shadow-card">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <ClipboardList size={16} className="text-[#b84c00]" />
            Development Plan (Coach Quest)
          </h2>
          <ul className="flex flex-col gap-2">
            {coachQuests.map((q) => (
              <li key={q.id} className="rounded-xl border border-zinc-200 p-3 text-sm">
                <div className="font-medium">{q.title}</div>
                {q.description && <div className="text-zinc-600 mt-0.5">{q.description}</div>}
                <div className="text-xs text-zinc-400 mt-1">{STATUS_LABEL[q.userActions[0]?.status ?? "not_started"]}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border border-zinc-200 p-4 shadow-card">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <Handshake size={16} className="text-[#b84c00]" />
          Coaching Sessions ({coaching.length})
        </h2>
        {coaching.length === 0 ? (
          <p className="text-sm text-zinc-500">ยังไม่มีบันทึกโค้ชชิ่ง</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {coaching.map((c) => (
              <li key={c.id} className="rounded-xl border border-zinc-200 p-3 text-sm flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{c.topic}</span>
                  <span className="text-[11px] text-zinc-400">{c.kind === "received" ? "รับโค้ชชิ่ง" : "ให้โค้ชชิ่ง"}</span>
                </div>
                <div className="text-xs text-zinc-400">
                  {c.date.toISOString().slice(0, 10)} · {c.status === "completed" ? "เสร็จแล้ว" : "นัดหมาย"}
                </div>
                {c.observation && <div className="text-zinc-600">สังเกต: {c.observation}</div>}
                {c.strength && <div className="text-green-700">จุดแข็ง: {c.strength}</div>}
                {c.gap && <div className="text-amber-700">จุดที่ต้องพัฒนา: {c.gap}</div>}
                {c.feedback && <div className="text-zinc-600">Feedback: {c.feedback}</div>}
                {c.actionPlan && <div className="text-zinc-600">Action Plan: {c.actionPlan}</div>}
                {c.followUpDate && <div className="text-xs text-zinc-400">ติดตามผล: {c.followUpDate.toISOString().slice(0, 10)}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
