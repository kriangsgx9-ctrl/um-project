"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { ShareCard, type ShareCardProps } from "./ShareCard";

export function ShareCardButton({ cardProps, buttonLabel }: { cardProps: ShareCardProps; buttonLabel: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function download() {
    if (!ref.current) return;
    setBusy(true);
    try {
      const dataUrl = await toPng(ref.current, { pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = "prime-um-ascend-share-card.png";
      link.href = dataUrl;
      link.click();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-xs font-medium text-[#b84c00] underline">
        {buttonLabel}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="แชร์การ์ดความสำเร็จ"
        >
          <div className="flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
            <div ref={ref}>
              <ShareCard {...cardProps} />
            </div>
            <div className="flex gap-2">
              <button disabled={busy} onClick={download} className="rounded-lg bg-[#ff6b00] text-[#111111] font-semibold px-4 py-2 disabled:opacity-50">
                {busy ? "กำลังสร้าง..." : "ดาวน์โหลดรูป"}
              </button>
              <button onClick={() => setOpen(false)} className="rounded-lg border border-white text-white px-4 py-2">
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
