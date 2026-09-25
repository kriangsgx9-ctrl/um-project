import { redirect } from "next/navigation";
import { AlertTriangle, CheckCircle2, Circle, Clock, Eye, Trophy, type LucideIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadStoreForUser } from "@/lib/data/load-store";
import { DONE, isUMReady, userById } from "@/lib/domain/actions";
import { avg, clamp, lastMonths, pct } from "@/lib/domain/dates";
import { kpiAch, kpiVal } from "@/lib/domain/kpi";
import { funnelCounts, STAGES } from "@/lib/domain/funnel";
import { risks } from "@/lib/domain/risk";
import { PageHeader } from "@/components/PageHeader";

type ItemStatus = "not_started" | "in_progress" | "needs_development" | "ready_for_review" | "verified";

const STATUS_LABEL: Record<ItemStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  needs_development: "Needs Development",
  ready_for_review: "Ready for Review",
  verified: "Verified",
};

const STATUS_STYLE: Record<ItemStatus, string> = {
  not_started: "bg-zinc-50 border-zinc-200 text-zinc-500",
  in_progress: "bg-blue-50 border-blue-200 text-blue-700",
  needs_development: "bg-red-50 border-red-200 text-red-700",
  ready_for_review: "bg-amber-50 border-amber-200 text-amber-700",
  verified: "bg-green-50 border-green-200 text-green-700",
};

const STATUS_ICON: Record<ItemStatus, LucideIcon> = {
  not_started: Circle,
  in_progress: Clock,
  needs_development: AlertTriangle,
  ready_for_review: Eye,
  verified: CheckCircle2,
};

function deriveStatus(pctDone: number, hasRisk: boolean, isReviewed: boolean): ItemStatus {
  if (pctDone <= 0) return "not_started";
  if (hasRisk) return "needs_development";
  if (pctDone < 70) return "in_progress";
  if (pctDone < 100) return "ready_for_review";
  return isReviewed ? "verified" : "ready_for_review";
}

export default async function PromotionPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const store = await loadStoreForUser(prisma, userId);
  const user = userById(store, userId)!;
  const riskCats = new Set(risks(store, userId).map((r) => r.cat));
  const riskKeys = new Set(risks(store, userId).map((r) => r.key));

  const categoryCompletion = (cat: string): number => {
    const required = store.actions.filter((a) => a.category === cat && a.required);
    if (!required.length) return 0;
    const done = required.filter((a) => DONE.has(store.userActions.find((x) => x.actionId === a.id)?.status ?? "not_started")).length;
    return pct(done, required.length);
  };

  const months = lastMonths(3);
  const productionPct = Math.round(kpiAch(store, userId, "fyp", months) * 100);

  const funnel = funnelCounts(store, userId);
  const recruitTargets = store.settings.recruitTargets;
  const recruitPct = Math.round(
    avg([
      clamp(pct(funnel[STAGES.findIndex((s) => s.k === "contact")], recruitTargets.contact)),
      clamp(pct(funnel[STAGES.findIndex((s) => s.k === "interview")], recruitTargets.interview)),
      clamp(pct(funnel[STAGES.findIndex((s) => s.k === "presentation")], recruitTargets.presentation)),
      clamp(pct(funnel[STAGES.findIndex((s) => s.k === "onboard")], recruitTargets.onboard)),
    ])
  );

  const currentMonth = months[months.length - 1];
  const teamDevPct = clamp(pct(kpiVal(store, userId, currentMonth, "teamMeetings"), store.settings.kpiTargets.teamMeetings || 1));
  const leadershipPct = categoryCompletion("Leadership");
  const managementPct = categoryCompletion("Management");

  const requiredEvidenceActions = store.actions.filter((a) => a.evidence && a.required);
  const verifiedEvidence = store.evidence.filter((e) => e.userId === userId && e.status === "verified");
  const evidencePct = requiredEvidenceActions.length ? pct(verifiedEvidence.length, requiredEvidenceActions.length) : 0;

  const reviewedAssessment = await prisma.competencyAssessment.findFirst({
    where: { userId, reviewerId: { not: null } },
    include: { reviewer: { select: { name: true } } },
    orderBy: { assessedAt: "desc" },
  });
  const latestScores = new Map<string, number>();
  for (const a of store.assessments) if (!latestScores.has(a.competencyId)) latestScores.set(a.competencyId, a.score);
  const coachAssessmentPct = latestScores.size ? Math.round((avg(Array.from(latestScores.values())) / 5) * 100) : 0;

  const finalPresentationPct = isUMReady(store, user) ? 100 : 0;

  const items = [
    { key: "production", label: "Personal Production", pctDone: productionPct, hasRisk: riskCats.has("Production"), reviewer: null as string | null, date: null as string | null, comment: "" },
    { key: "recruitment", label: "Recruitment", pctDone: recruitPct, hasRisk: riskCats.has("Recruitment"), reviewer: null, date: null, comment: "" },
    { key: "teamDevelopment", label: "Team Development", pctDone: teamDevPct, hasRisk: false, reviewer: null, date: null, comment: "" },
    { key: "leadership", label: "Leadership", pctDone: leadershipPct, hasRisk: riskCats.has("Leadership"), reviewer: null, date: null, comment: "" },
    { key: "management", label: "Management", pctDone: managementPct, hasRisk: riskCats.has("Management") && !riskKeys.has("evidence"), reviewer: null, date: null, comment: "" },
    { key: "evidence", label: "Evidence", pctDone: evidencePct, hasRisk: riskKeys.has("evidence"), reviewer: null, date: null, comment: "" },
    {
      key: "coachAssessment",
      label: "Coach Assessment",
      pctDone: coachAssessmentPct,
      hasRisk: false,
      reviewer: reviewedAssessment?.reviewer?.name ?? null,
      date: reviewedAssessment?.assessedAt.toISOString().slice(0, 10) ?? null,
      comment: reviewedAssessment?.comment ?? "",
    },
    { key: "finalPresentation", label: "Final Presentation", pctDone: finalPresentationPct, hasRisk: false, reviewer: null, date: null, comment: "" },
  ] as const;

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <PageHeader icon={Trophy}>Promotion Readiness</PageHeader>
      <p className="text-xs text-zinc-400 -mt-2">สัญญาณความพร้อมภายในจากข้อมูลจริงในระบบ ไม่ใช่ผลตัดสินการเลื่อนตำแหน่งอัตโนมัติ — การเลื่อนตำแหน่งจริงต้องผ่านการรีวิวจากโค้ชและ AL</p>

      <div className="rounded-2xl border border-zinc-200 shadow-card divide-y divide-zinc-100 overflow-hidden">
        {items.map((item) => {
          const status = deriveStatus(item.pctDone, item.hasRisk, !!item.reviewer);
          const StatusIcon = STATUS_ICON[status];
          return (
            <div key={item.key} className="p-4 flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{item.label}</span>
                <span className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border flex-none ${STATUS_STYLE[status]}`}>
                  <StatusIcon size={12} />
                  {STATUS_LABEL[status]}
                </span>
              </div>
              <div className="h-2 rounded-full bg-zinc-200 overflow-hidden">
                <div className="h-full bg-[#ff6b00]" style={{ width: `${Math.min(100, Math.max(0, item.pctDone))}%` }} />
              </div>
              <div className="text-xs text-zinc-400">
                {item.pctDone}% เสร็จสมบูรณ์
                {item.reviewer && ` · รีวิวโดย ${item.reviewer}${item.date ? ` (${item.date})` : ""}`}
              </div>
              {item.comment && <div className="text-xs text-zinc-500">{item.comment}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
