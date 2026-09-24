// Level curve per PRIME_UM_ASCEND_V2_GAME_MODE.md §3.4:
// "XP required to reach level n = 100 x n^1.5 (rounded to nearest 10)".
// Interpreted as a cumulative threshold (total lifetime XP needed to *be at* level n).
// `multiplier` is the admin-tunable knob (GameSettings.levelCurve) for retuning how
// fast players climb without a code change — see the Sprint B design note on why
// multiplier=1 (the literal spec formula) is the shipped default.
export interface LevelCurveConfig {
  base: number;
  exponent: number;
  roundTo: number;
  multiplier: number;
  maxLevel: number;
}

export const DEFAULT_LEVEL_CURVE: LevelCurveConfig = {
  base: 100,
  exponent: 1.5,
  roundTo: 10,
  multiplier: 1,
  maxLevel: 30,
};

export function xpThresholdForLevel(level: number, cfg: LevelCurveConfig = DEFAULT_LEVEL_CURVE): number {
  const raw = cfg.base * cfg.multiplier * Math.pow(level, cfg.exponent);
  return Math.round(raw / cfg.roundTo) * cfg.roundTo;
}

export function levelForXp(xp: number, cfg: LevelCurveConfig = DEFAULT_LEVEL_CURVE): number {
  let level = 1;
  for (let n = 1; n <= cfg.maxLevel; n++) {
    if (xp >= xpThresholdForLevel(n, cfg)) level = n;
    else break;
  }
  return level;
}

export type Rank = "Climber" | "Pathfinder" | "Rope Leader" | "Ridge Captain" | "Summit Ready";

/** Cosmetic only — must never reuse a real company title (UM/DM/etc), per §3.4. */
export function rankForLevel(level: number): Rank {
  if (level >= 21) return "Summit Ready";
  if (level >= 16) return "Ridge Captain";
  if (level >= 11) return "Rope Leader";
  if (level >= 6) return "Pathfinder";
  return "Climber";
}

export interface XpToNextLevel {
  level: number;
  nextLevel: number | null;
  xpIntoLevel: number;
  xpNeededForNext: number | null;
}

export function xpToNextLevel(xp: number, cfg: LevelCurveConfig = DEFAULT_LEVEL_CURVE): XpToNextLevel {
  const level = levelForXp(xp, cfg);
  const currentThreshold = xpThresholdForLevel(level, cfg);
  if (level >= cfg.maxLevel) {
    return { level, nextLevel: null, xpIntoLevel: xp - currentThreshold, xpNeededForNext: null };
  }
  const nextLevel = level + 1;
  const nextThreshold = xpThresholdForLevel(nextLevel, cfg);
  return { level, nextLevel, xpIntoLevel: xp - currentThreshold, xpNeededForNext: nextThreshold - xp };
}
