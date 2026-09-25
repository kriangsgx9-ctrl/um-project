"use client";

// V2 §6 Review Queue: swipe right = Verified, swipe left = Needs Revision
// (comment required first). Pointer-drag gesture PLUS explicit buttons — the
// buttons are not a fallback, they're required for keyboard/non-touch access
// (v1 §42 accessibility); the swipe is a convenience on top.
import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { requestRevisionAction, verifyEvidenceAction } from "@/app/(app)/team/[userId]/actions";
import type { StoredEvidenceFile } from "@/lib/storage/evidence-files";

const SWIPE_THRESHOLD = 90;

export function EvidenceReviewCard({
  targetUserId,
  evidenceId,
  title,
  description,
  date,
  files,
}: {
  targetUserId: string;
  evidenceId: string;
  title: string;
  description: string;
  date: string;
  files: StoredEvidenceFile[];
}) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [pending, startTransition] = useTransition();
  const startX = useRef(0);

  function onPointerDown(e: React.PointerEvent) {
    startX.current = e.clientX;
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    setDragX(e.clientX - startX.current);
  }
  function onPointerUp() {
    setDragging(false);
    if (dragX > SWIPE_THRESHOLD) doVerify();
    else if (dragX < -SWIPE_THRESHOLD) setShowRevisionForm(true);
    setDragX(0);
  }

  function doVerify() {
    startTransition(async () => {
      await verifyEvidenceAction(targetUserId, evidenceId);
    });
  }

  const tilt = Math.max(-8, Math.min(8, dragX / 10));
  const bg = dragX > 20 ? "bg-green-50 border-green-300" : dragX < -20 ? "bg-red-50 border-red-300" : "bg-white border-zinc-200";

  return (
    <div className="flex flex-col gap-2">
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ transform: `translateX(${dragX}px) rotate(${tilt}deg)`, touchAction: "pan-y" }}
        className={`rounded-xl border p-4 cursor-grab select-none transition-colors text-zinc-900 ${bg}`}
      >
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-zinc-500 mt-1">{date}</div>
        {description && <p className="text-sm text-zinc-600 mt-2">{description}</p>}
        {files.length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {files.map((f) =>
              f.type.startsWith("image/") ? (
                <a key={f.url} href={f.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                  <Image src={f.url} alt={f.name} width={64} height={64} className="w-16 h-16 object-cover rounded-lg border border-zinc-200" />
                </a>
              ) : (
                <a
                  key={f.url}
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs underline text-blue-700 px-2 py-1 border border-zinc-200 rounded-lg"
                >
                  📄 {f.name}
                </a>
              )
            )}
          </div>
        )}
        <p className="text-[11px] text-zinc-400 mt-2">ปัดขวา = ยืนยัน · ปัดซ้าย = ขอแก้ไข</p>
      </div>

      <div className="flex gap-2">
        <button
          disabled={pending}
          onClick={doVerify}
          className="flex-1 rounded-lg bg-green-600 text-white text-sm font-medium py-1.5 disabled:opacity-50"
        >
          ✓ ยืนยันหลักฐาน (+80 XP)
        </button>
        <button
          disabled={pending}
          onClick={() => setShowRevisionForm((s) => !s)}
          className="flex-1 rounded-lg border border-amber-400 text-amber-700 text-sm font-medium py-1.5"
        >
          ขอแก้ไข
        </button>
      </div>

      {showRevisionForm && (
        <form action={requestRevisionAction.bind(null, targetUserId, evidenceId)} className="flex gap-2">
          <input
            name="comment"
            required
            aria-label="ระบุสิ่งที่ต้องแก้"
            placeholder="ระบุสิ่งที่ต้องแก้ (จำเป็น)"
            className="flex-1 border border-zinc-300 rounded-lg px-2 py-1 text-sm"
          />
          <button type="submit" className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-sm font-medium">
            ส่ง
          </button>
        </form>
      )}
    </div>
  );
}
