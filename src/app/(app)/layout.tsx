import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [candidates, inProgressActions] = await Promise.all([
    prisma.candidate.findMany({
      where: { ownerId: session.user.id, status: "active" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.userAction.findMany({
      where: { userId: session.user.id, status: { in: ["in_progress", "not_started"] } },
      include: { action: { select: { title: true, evidence: true } } },
    }),
  ]);
  const evidenceActions = inProgressActions
    .filter((ua) => ua.action.evidence)
    .map((ua) => ({ actionId: ua.actionId, title: ua.action.title }));

  return (
    <AppShell
      userName={session.user.name ?? ""}
      role={session.user.role}
      quickLogCandidates={candidates}
      quickLogEvidenceActions={evidenceActions}
    >
      {children}
    </AppShell>
  );
}
