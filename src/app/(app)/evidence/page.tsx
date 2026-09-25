import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { StoredEvidenceFile } from "@/lib/storage/evidence-files";
import { EvidenceList, type EvidenceRow } from "@/components/Evidence/EvidenceList";

export default async function EvidencePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [evidence, phases] = await Promise.all([
    prisma.evidence.findMany({
      where: { userId },
      include: { reviewer: { select: { name: true } } },
      orderBy: { date: "desc" },
    }),
    prisma.phase.findMany({ select: { id: true, key: true } }),
  ]);
  const phaseKeyById = new Map(phases.map((p) => [p.id, p.key]));

  const rows: EvidenceRow[] = evidence.map((e) => ({
    id: e.id,
    title: e.title,
    category: e.category,
    date: e.date.toISOString().slice(0, 10),
    description: e.description,
    status: e.status,
    actionId: e.actionId,
    phaseKey: phaseKeyById.get(e.phaseId) ?? "-",
    reviewerName: e.reviewer?.name ?? null,
    reviewerComment: e.reviewerComment,
    files: Array.isArray(e.files) ? (e.files as unknown as StoredEvidenceFile[]) : [],
  }));

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <h1 className="text-2xl font-bold">Evidence</h1>
      <p className="text-xs text-zinc-400 -mt-2">หลักฐานทั้งหมดที่คุณเคยส่งในโปรแกรม ({rows.length} รายการ)</p>
      <EvidenceList rows={rows} />
    </div>
  );
}
