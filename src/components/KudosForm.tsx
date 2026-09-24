"use client";

// Sending Kudos can legitimately hit the 3/day cap in normal use (not just
// misuse) — that must surface as a friendly inline message, not an uncaught
// exception thrown from a plain <form action>. Mirrors QuickLogButton's
// direct-call + startTransition pattern for the same reason.
import { useState, useTransition } from "react";
import { sendKudosAction } from "@/app/(app)/team/actions";

export function KudosForm({ toUserId, toName }: { toUserId: string; toName: string }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!message.trim()) return;
    setError(null);
    const formData = new FormData();
    formData.set("message", message);
    startTransition(async () => {
      try {
        await sendKudosAction(toUserId, formData);
        setMessage("");
        setSent(true);
        setTimeout(() => setSent(false), 2000);
      } catch (e) {
        setError(e instanceof Error ? e.message : "ส่งไม่สำเร็จ ลองใหม่อีกครั้ง");
      }
    });
  }

  return (
    <div className="flex flex-col gap-1 mt-2">
      <div className="flex gap-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          aria-label={`ข้อความ Kudos ถึง ${toName}`}
          placeholder="ข้อความให้กำลังใจสั้น ๆ"
          className="flex-1 border border-zinc-300 rounded-lg px-2 py-1 text-sm"
        />
        <button
          type="button"
          disabled={pending || !message.trim()}
          onClick={submit}
          className="px-3 py-1.5 rounded-full bg-[#ff6b00] text-[#111111] text-sm font-medium disabled:opacity-50"
        >
          {sent ? "ส่งแล้ว ✓" : "ส่ง"}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
