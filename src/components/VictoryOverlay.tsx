"use client";

// V2 §3.6 Victory screen. Respects prefers-reduced-motion (skips confetti) per
// §5.2 / Acceptance Criteria §13, and shows at most once per gate — the caller
// only renders this when acknowledgedAt is still null (see actions.ts).
import { useEffect } from "react";
import confetti from "canvas-confetti";
import { acknowledgeVictoryAction } from "@/app/(app)/journey/[phaseId]/actions";

export function VictoryOverlay({ gateReviewId, gateName }: { gateReviewId: string; gateName: string }) {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced) {
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 }, colors: ["#ff6b00", "#ffb800", "#111111"] });
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full">
        <div className="text-5xl mb-2">🏆</div>
        <h2 className="text-xl font-bold">ชนะ {gateName}!</h2>
        <p className="text-[#ffb800] font-bold text-lg mt-2">+500 XP</p>
        <p className="text-zinc-500 text-sm mt-1">ปลดล็อกโซนใหม่แล้ว</p>
        <form action={acknowledgeVictoryAction.bind(null, gateReviewId)}>
          <button type="submit" className="mt-6 w-full rounded-lg bg-[#ff6b00] text-[#111111] font-semibold py-2">
            ไปต่อ
          </button>
        </form>
      </div>
    </div>
  );
}
