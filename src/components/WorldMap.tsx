// SVG World Map (V2 §2.1): a vertical winding path through the 6 phases, drawn
// entirely in SVG/CSS (no external images), with the user's avatar placed by
// interpolating overall progress. Zone taps are plain HTML links positioned
// over the SVG (simpler and more accessible than native SVG hit-testing).
import Link from "next/link";
import { renderAvatarSvg, type AvatarConfig } from "@/lib/avatar";
import type { Phase } from "@/lib/domain/types";

interface WorldMapProps {
  phases: Phase[];
  currentPhase: number;
  currentPhaseProgressPct: number; // 0-100, phaseProgress() for the current phase
  avatarConfig: AvatarConfig;
  phasesPassed: number;
}

const ZONE_COUNT = 6;
const VIEW_W = 320;
const VIEW_H = 820;
const TOP_MARGIN = 60;
const BOTTOM_MARGIN = 60;

function zonePoint(indexFromBottom: number) {
  const step = (VIEW_H - TOP_MARGIN - BOTTOM_MARGIN) / (ZONE_COUNT - 1);
  const y = VIEW_H - BOTTOM_MARGIN - indexFromBottom * step;
  const x = VIEW_W / 2 + (indexFromBottom % 2 === 0 ? -70 : 70);
  return { x, y };
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function WorldMap({ phases, currentPhase, currentPhaseProgressPct, avatarConfig, phasesPassed }: WorldMapProps) {
  const points = phases.map((_, i) => zonePoint(i));
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  const isUmReady = currentPhase > phases.length;
  const currentIdx = Math.min(currentPhase - 1, phases.length - 1);
  const avatarPos = isUmReady
    ? points[points.length - 1]
    : (() => {
        const cur = points[currentIdx];
        const next = points[Math.min(currentIdx + 1, points.length - 1)];
        const t = currentIdx === points.length - 1 ? 0 : currentPhaseProgressPct / 100;
        return { x: lerp(cur.x, next.x, t), y: lerp(cur.y, next.y, t) };
      })();

  return (
    <div className="relative w-full max-w-sm mx-auto">
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full h-auto rounded-2xl">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a1d2e" />
            <stop offset="55%" stopColor="#3b2a4a" />
            <stop offset="100%" stopColor="#ff8a3d" />
          </linearGradient>
        </defs>
        <rect width={VIEW_W} height={VIEW_H} fill="url(#sky)" />
        <path d={pathD} stroke="#ffffff55" strokeWidth={4} fill="none" strokeDasharray="2 10" strokeLinecap="round" />

        {phases.map((p, i) => {
          const pt = points[i];
          const state = p.no < currentPhase ? "done" : p.no === currentPhase ? "current" : "upcoming";
          const fill = state === "done" ? "#111111" : state === "current" ? "#ff6b00" : "#5a5a6a";
          return (
            <g key={p.id}>
              {state === "current" && (
                <circle cx={pt.x} cy={pt.y} r="22" fill="#ff6b00" opacity="0.35" className="motion-safe:animate-ping" style={{ transformOrigin: `${pt.x}px ${pt.y}px` }} />
              )}
              <circle cx={pt.x} cy={pt.y} r="16" fill={fill} stroke="#ffffff" strokeWidth={2} opacity={state === "upcoming" ? 0.5 : 1} />
              <text x={pt.x} y={pt.y + 34} textAnchor="middle" fontSize="11" fill="#ffffff" opacity={state === "upcoming" ? 0.5 : 0.9}>
                {p.key}
              </text>
            </g>
          );
        })}

        <g transform={`translate(${avatarPos.x - 16}, ${avatarPos.y - 40})`}>{renderAvatarSvg(avatarConfig, phasesPassed, 32)}</g>
      </svg>

      {phases.map((p, i) => {
        const pt = points[i];
        return (
          <Link
            key={p.id}
            href={`/journey/${p.id}`}
            aria-label={`เปิดรายละเอียด ${p.key}`}
            className="absolute w-10 h-10 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ left: `${(pt.x / VIEW_W) * 100}%`, top: `${(pt.y / VIEW_H) * 100}%` }}
          />
        );
      })}
    </div>
  );
}
