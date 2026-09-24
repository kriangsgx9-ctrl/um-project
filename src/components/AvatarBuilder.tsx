"use client";

import { useState, useTransition } from "react";
import {
  HAIR_STYLES,
  SHIRT_COLORS,
  SKIN_TONES,
  renderAvatarSvg,
  type AvatarConfig,
  type HairStyle,
  type SkinTone,
} from "@/lib/avatar";
import { updateAvatarAction } from "@/app/(app)/profile/actions";

export function AvatarBuilder({ initial, phasesPassed }: { initial: AvatarConfig; phasesPassed: number }) {
  const [config, setConfig] = useState<AvatarConfig>(initial);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function save() {
    startTransition(async () => {
      await updateAvatarAction(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="rounded-2xl border border-zinc-200 p-4 flex flex-col gap-4">
      <div className="flex items-center gap-4">
        {renderAvatarSvg(config, phasesPassed, 72)}
        <div className="text-sm text-zinc-500">แก้ไข Avatar ของคุณ — ไม่มีตัวละครลิขสิทธิ์ วาดจาก SVG ล้วน</div>
      </div>

      <div>
        <div className="text-xs font-semibold text-zinc-500 mb-2">สีผิว</div>
        <div className="flex gap-2">
          {SKIN_TONES.map((s) => (
            <button
              key={s.value}
              onClick={() => setConfig((c) => ({ ...c, skin: s.value as SkinTone }))}
              className={`w-9 h-9 rounded-full border-2 ${config.skin === s.value ? "border-[#ff6b00]" : "border-transparent"}`}
              style={{ backgroundColor: s.hex }}
              aria-label={s.label}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold text-zinc-500 mb-2">ทรงผม</div>
        <div className="flex gap-2">
          {HAIR_STYLES.map((h) => (
            <button
              key={h.value}
              onClick={() => setConfig((c) => ({ ...c, hair: h.value as HairStyle }))}
              className={`px-3 py-1.5 rounded-full border text-sm ${
                config.hair === h.value ? "border-[#ff6b00] bg-[#fff1e6]" : "border-zinc-200"
              }`}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold text-zinc-500 mb-2">สีเสื้อ</div>
        <div className="flex gap-2">
          {SHIRT_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setConfig((cfg) => ({ ...cfg, shirtColor: c }))}
              className={`w-9 h-9 rounded-full border-2 ${config.shirtColor === c ? "border-[#ff6b00]" : "border-transparent"}`}
              style={{ backgroundColor: c }}
              aria-label={c}
            />
          ))}
        </div>
      </div>

      <button disabled={pending} onClick={save} className="rounded-lg bg-[#ff6b00] text-[#111111] font-semibold py-2 disabled:opacity-50">
        {saved ? "บันทึกแล้ว ✓" : "บันทึก Avatar"}
      </button>
    </div>
  );
}
