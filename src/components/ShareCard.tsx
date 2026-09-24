// V2 §3.9 Share Card: renders to a PNG via html-to-image (ShareCardButton).
// Deliberately carries only the user's own name/level/streak/gate/badge —
// never candidate/customer names or revenue figures, per the spec's own
// constraint on what a shareable card may contain.
import { renderAvatarSvg, type AvatarConfig } from "@/lib/avatar";

export interface ShareCardProps {
  name: string;
  avatarConfig: AvatarConfig;
  phasesPassed: number;
  headline: string;
  subline: string;
}

export function ShareCard({ name, avatarConfig, phasesPassed, headline, subline }: ShareCardProps) {
  return (
    <div
      style={{ width: 320, background: "linear-gradient(180deg, #1a1d2e 0%, #3b2a4a 55%, #ff8a3d 100%)" }}
      className="rounded-3xl text-white p-8 flex flex-col items-center gap-2 text-center"
    >
      <div className="text-[10px] tracking-[0.2em] opacity-70">PRIME UM ASCEND</div>
      <div className="mt-2">{renderAvatarSvg(avatarConfig, phasesPassed, 80)}</div>
      <div className="text-xl font-extrabold mt-2">{headline}</div>
      <div className="text-sm opacity-90">{subline}</div>
      <div className="text-xs opacity-60 mt-4">{name}</div>
      <div className="text-[10px] opacity-40 mt-1">From Agent → Leader → UM</div>
    </div>
  );
}
