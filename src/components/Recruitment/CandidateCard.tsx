"use client";

import { useState, useTransition } from "react";
import { advanceCandidateStageAction, markCandidateLostAction, updateCandidateNoteAction } from "@/app/(app)/recruitment/actions";
import { STAGES } from "@/lib/domain/funnel";

export interface CandidateCardData {
  id: string;
  name: string;
  phone: string;
  source: string;
  stage: number;
  status: "active" | "lost";
  nextAction: string;
  nextActionDate: string | null;
  notes: string;
  updatedAt: string;
}

export function CandidateCard({ candidate }: { candidate: CandidateCardData }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState(candidate.stage);

  function onStageChange(next: number) {
    setStage(next);
    setError(null);
    startTransition(async () => {
      try {
        await advanceCandidateStageAction(candidate.id, next, "");
      } catch (e) {
        setStage(candidate.stage);
        setError(e instanceof Error ? e.message : "อัปเดตขั้นไม่สำเร็จ");
      }
    });
  }

  return (
    <li className={`rounded-xl border p-3 flex flex-col gap-2 ${candidate.status === "lost" ? "border-zinc-200 opacity-60" : "border-zinc-200"}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-medium">{candidate.name}</div>
          <div className="text-xs text-zinc-500">
            {candidate.phone || "ไม่มีเบอร์"} · แหล่งที่มา: {candidate.source}
          </div>
        </div>
        {candidate.status === "lost" && <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-zinc-50 border-zinc-200 text-zinc-500 flex-none">Lost</span>}
      </div>

      <select
        aria-label={`ขั้นของ ${candidate.name}`}
        value={stage}
        disabled={pending || candidate.status === "lost"}
        onChange={(e) => onStageChange(Number(e.target.value))}
        className="border border-zinc-300 rounded-lg px-2 py-1.5 text-sm disabled:opacity-50"
      >
        {STAGES.map((s, i) => (
          <option key={s.k} value={i}>
            {s.th}
          </option>
        ))}
      </select>
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}

      <details>
        <summary className="cursor-pointer text-xs text-[#b84c00]">Next Action / บันทึก</summary>
        <form action={updateCandidateNoteAction.bind(null, candidate.id)} className="flex flex-col gap-2 mt-2">
          <input
            name="nextAction"
            defaultValue={candidate.nextAction}
            aria-label="Next Action"
            placeholder="สิ่งที่ต้องทำต่อ"
            className="border border-zinc-300 rounded-lg px-2 py-1.5 text-sm"
          />
          <input name="nextActionDate" type="date" defaultValue={candidate.nextActionDate ?? ""} aria-label="วันที่ทำ Next Action" className="border border-zinc-300 rounded-lg px-2 py-1.5 text-sm" />
          <textarea name="notes" defaultValue={candidate.notes} aria-label="บันทึกเพิ่มเติม" placeholder="บันทึกเพิ่มเติม" rows={2} className="border border-zinc-300 rounded-lg px-2 py-1.5 text-sm" />
          <button type="submit" className="rounded-lg bg-[#111111] text-white text-sm font-medium py-1.5">
            บันทึก
          </button>
        </form>
        {candidate.status === "active" && (
          <form action={markCandidateLostAction.bind(null, candidate.id)} className="mt-2">
            <button type="submit" className="text-xs text-red-600 underline">
              ทำเครื่องหมายว่าไม่สำเร็จ (Lost)
            </button>
          </form>
        )}
      </details>
    </li>
  );
}
