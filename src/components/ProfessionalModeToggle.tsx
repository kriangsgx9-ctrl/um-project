"use client";

import { useState, useTransition } from "react";
import { setProfessionalModeAction } from "@/app/(app)/profile/actions";

export function ProfessionalModeToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    startTransition(async () => {
      await setProfessionalModeAction(next);
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      role="switch"
      aria-checked={enabled}
      className={`flex items-center gap-3 px-3 py-2 rounded-full border text-sm font-medium ${
        enabled ? "bg-[#111111] text-white border-[#111111]" : "border-zinc-300 text-zinc-600"
      }`}
    >
      <span className={`w-9 h-5 rounded-full relative transition-colors ${enabled ? "bg-[#ff6b00]" : "bg-zinc-300"}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${enabled ? "left-4" : "left-0.5"}`} />
      </span>
      {enabled ? "เปิดอยู่" : "ปิดอยู่"}
    </button>
  );
}
