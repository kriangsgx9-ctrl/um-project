import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadStoreForUser } from "@/lib/data/load-store";
import { overallProgress, userById } from "@/lib/domain/actions";
import { fmtMoney, lastMonths } from "@/lib/domain/dates";
import { kpiTarget, kpiVal } from "@/lib/domain/kpi";
import { funnelCounts, STAGES } from "@/lib/domain/funnel";
import { KpiTrendChart, type KpiTrendPoint } from "@/components/Performance/KpiTrendChart";

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 p-3">
      <div className="text-lg font-bold tabular-nums">{value}</div>
      <div className="text-xs text-zinc-500">{label}</div>
      {sub && <div className="text-[11px] text-zinc-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-2 rounded-full bg-zinc-200 overflow-hidden">
      <div className="h-full bg-[#ff6b00]" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

export default async function PerformancePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const store = await loadStoreForUser(prisma, userId);
  const user = userById(store, userId)!;
  const months = lastMonths(3);
  const currentMonth = months[months.length - 1];

  const trend: KpiTrendPoint[] = months.map((m) => ({ month: m.slice(5), actual: kpiVal(store, userId, m, "fyp"), target: kpiTarget(store, userId, m, "fyp") }));

  const produceMetrics = [
    { key: "fyp", label: "FYP", fmt: fmtMoney },
    { key: "nbc", label: "NBC", fmt: (n: number) => String(n) },
    { key: "cases", label: "Case", fmt: (n: number) => String(n) },
    { key: "activity", label: "Activity", fmt: (n: number) => String(n) },
  ];

  const funnel = funnelCounts(store, userId);
  const coachingCount = store.coaching.filter((c) => c.status === "completed").length;
  const training = kpiVal(store, userId, currentMonth, "training");
  const oneOnOne = kpiVal(store, userId, currentMonth, "oneOnOne");
  const developActionsDone = store.actions.filter((a) => a.category === "Development" && a.required).length;
  const teamMeetings = kpiVal(store, userId, currentMonth, "teamMeetings");
  const teamActivity = kpiVal(store, userId, currentMonth, "teamActivity");
  const actionCompletionPct = overallProgress(store, user);

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Performance</h1>

      <div className="rounded-2xl border border-zinc-200 p-4 shadow-card">
        <h2 className="font-semibold mb-3">PRODUCE</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {produceMetrics.map((m) => {
            const actual = kpiVal(store, userId, currentMonth, m.key);
            const target = kpiTarget(store, userId, currentMonth, m.key);
            return <StatCard key={m.key} label={m.label} value={m.fmt(actual)} sub={target ? `เป้า ${m.fmt(target)}` : undefined} />;
          })}
        </div>
        <KpiTrendChart data={trend} />
      </div>

      <div className="rounded-2xl border border-zinc-200 p-4 shadow-card">
        <h2 className="font-semibold mb-3">RECRUIT</h2>
        <div className="grid grid-cols-3 gap-2">
          {STAGES.map((s, i) => (
            <StatCard key={s.k} label={s.th} value={String(funnel[i])} />
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 p-4 shadow-card">
        <h2 className="font-semibold mb-3">DEVELOP</h2>
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Coaching Sessions" value={String(coachingCount)} />
          <StatCard label="Training" value={String(training)} />
          <StatCard label="1-on-1" value={String(oneOnOne)} />
        </div>
        <p className="text-xs text-zinc-400 mt-2">งาน Development ที่กำหนดไว้ในโปรแกรม: {developActionsDone} รายการ</p>
      </div>

      <div className="rounded-2xl border border-zinc-200 p-4 shadow-card">
        <h2 className="font-semibold mb-3">LEAD</h2>
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Team Meetings" value={String(teamMeetings)} sub={`เป้า ${kpiTarget(store, userId, currentMonth, "teamMeetings")}`} />
          <StatCard label="Team Activity" value={String(teamActivity)} sub={`เป้า ${kpiTarget(store, userId, currentMonth, "teamActivity")}`} />
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 p-4 shadow-card">
        <h2 className="font-semibold mb-3">MANAGE</h2>
        <div className="flex items-center justify-between text-sm mb-1">
          <span>Action Completion</span>
          <span className="font-medium tabular-nums">{actionCompletionPct}%</span>
        </div>
        <ProgressBar pct={actionCompletionPct} />
      </div>
    </div>
  );
}
