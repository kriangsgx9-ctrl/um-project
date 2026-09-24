// Avatar builder (V2 §3.7): SVG parts only, no external images or copyrighted
// characters, chosen by the user at onboarding/profile. A small row of dots
// under the avatar stands in for "evolves with phase" (gear/accessories are a
// later visual-polish pass) by marking how many Gates the user has passed.
export type SkinTone = "a" | "b" | "c";
export type HairStyle = "short" | "long" | "bald";

export interface AvatarConfig {
  skin: SkinTone;
  hair: HairStyle;
  shirtColor: string;
}

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = { skin: "b", hair: "short", shirtColor: "#ff6b00" };

export const SKIN_TONES: { value: SkinTone; hex: string; label: string }[] = [
  { value: "a", hex: "#f4c9a5", label: "อ่อน" },
  { value: "b", hex: "#c98a5a", label: "กลาง" },
  { value: "c", hex: "#7a4a2b", label: "เข้ม" },
];

export const HAIR_STYLES: { value: HairStyle; label: string }[] = [
  { value: "short", label: "ผมสั้น" },
  { value: "long", label: "ผมยาว" },
  { value: "bald", label: "โล้น" },
];

export const SHIRT_COLORS = ["#ff6b00", "#1f58b5", "#1e7a48", "#111111", "#b84c00"];

function skinHex(skin: SkinTone): string {
  return SKIN_TONES.find((s) => s.value === skin)?.hex ?? SKIN_TONES[1].hex;
}

function hairShape(hair: HairStyle) {
  if (hair === "bald") return null;
  if (hair === "long") return <path d="M14 34c-2-16 6-26 18-26s20 10 18 26c-3-6-8-9-8-9V22H22v3s-5 3-8 9z" fill="#2b2117" />;
  return <path d="M14 28c-1-13 7-22 18-22s19 9 18 22c-2-9-9-14-18-14s-16 5-18 14z" fill="#2b2117" />;
}

/**
 * phasesPassed drives the small progress-dot row beneath the avatar. Every
 * call site already shows the person's name as adjacent text, so this is
 * `aria-hidden` by default to avoid a redundant "avatar image" announcement
 * per row (e.g. the Guild Dashboard's list of cards) — pass `label` for the
 * rare standalone case where no adjacent name exists.
 */
export function renderAvatarSvg(config: AvatarConfig, phasesPassed: number = 0, size = 64, label?: string) {
  const skin = skinHex(config.skin);
  return (
    <svg
      viewBox="0 0 64 76"
      width={size}
      height={(size * 76) / 64}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      <circle cx="32" cy="26" r="18" fill={skin} />
      {hairShape(config.hair)}
      <path d="M10 76c2-16 10-24 22-24s20 8 22 24z" fill={config.shirtColor} />
      {phasesPassed > 0 && (
        <g>
          {Array.from({ length: Math.min(phasesPassed, 6) }).map((_, i) => (
            <circle key={i} cx={14 + i * 7} cy={72} r="2.5" fill="#ffb800" />
          ))}
        </g>
      )}
    </svg>
  );
}
