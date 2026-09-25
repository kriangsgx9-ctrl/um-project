"use client";

// V1 §11 Action Detail "Complete Action" CTA. Evidence-required actions reuse
// quick-log's submitEvidenceAction directly (same Evidence row / XP / file
// storage as Quick Log), so there is exactly one evidence-submission code path
// in the app, not two.
import { useState, useTransition } from "react";
import { completeActionWithoutEvidenceAction, startActionAction } from "@/app/(app)/actions/actions";
import { submitEvidenceAction } from "@/app/(app)/quick-log/actions";
import { MAX_EVIDENCE_FILES } from "@/lib/storage/evidence-limits";

export function ActionDetailControls({ actionId, status, requiresEvidence }: { actionId: string; status: string; requiresEvidence: boolean }) {
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  function start() {
    setError(null);
    startTransition(async () => {
      try {
        await startActionAction(actionId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "เริ่มไม่สำเร็จ ลองใหม่อีกครั้ง");
      }
    });
  }

  function completeNoEvidence() {
    setError(null);
    startTransition(async () => {
      try {
        await completeActionWithoutEvidenceAction(actionId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "ทำเครื่องหมายไม่สำเร็จ ลองใหม่อีกครั้ง");
      }
    });
  }

  function submitEvidence() {
    setError(null);
    startTransition(async () => {
      try {
        const formData = new FormData();
        files.forEach((f) => formData.append("files", f));
        await submitEvidenceAction(actionId, note, formData);
        setNote("");
        setFiles([]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "ส่งไม่สำเร็จ ลองใหม่อีกครั้ง");
      }
    });
  }

  if (status === "submitted" || status === "waiting_review") {
    return <p className="text-sm text-amber-600 font-medium">รอโค้ชรีวิว (Waiting for Coach Review)</p>;
  }
  if (status === "verified" || status === "completed") {
    return <p className="text-sm text-green-700 font-medium">เสร็จสมบูรณ์แล้ว</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {status === "not_started" && (
        <button disabled={pending} onClick={start} className="rounded-lg bg-[#ff6b00] text-[#111111] font-semibold py-2 disabled:opacity-50">
          Start Action
        </button>
      )}

      {status !== "not_started" && !requiresEvidence && (
        <button disabled={pending} onClick={completeNoEvidence} className="rounded-lg bg-[#ff6b00] text-[#111111] font-semibold py-2 disabled:opacity-50">
          Complete Action
        </button>
      )}

      {status !== "not_started" && requiresEvidence && (
        <div className="flex flex-col gap-2 border border-zinc-200 rounded-xl p-3">
          <h3 className="font-semibold text-sm">ส่งหลักฐาน</h3>
          {status === "needs_revision" && <p className="text-xs text-amber-700">โค้ชขอให้แก้ไขก่อน — ส่งใหม่อีกครั้งได้เลย</p>}
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            aria-label="สรุปผลลัพธ์"
            placeholder="สรุปผลลัพธ์สั้น ๆ"
            rows={3}
            className="border border-zinc-300 rounded-lg p-2 text-sm"
          />
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,application/pdf"
            aria-label="แนบไฟล์หลักฐาน (รูปภาพหรือ PDF)"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, MAX_EVIDENCE_FILES))}
            className="text-xs"
          />
          {files.length > 0 && (
            <ul className="text-xs text-zinc-500 flex flex-col gap-0.5">
              {files.map((f) => (
                <li key={f.name}>
                  📎 {f.name} ({Math.ceil(f.size / 1024)} KB)
                </li>
              ))}
            </ul>
          )}
          <button disabled={pending} onClick={submitEvidence} className="rounded-lg bg-[#ff6b00] text-[#111111] font-semibold py-2 disabled:opacity-40">
            ส่งให้โค้ชดู
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
