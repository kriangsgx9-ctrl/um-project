import { describe, expect, it } from "vitest";
import { DEFAULT_LEVEL_CURVE, levelForXp, rankForLevel, xpThresholdForLevel, xpToNextLevel } from "./level";

describe("level curve", () => {
  it("matches 100 x n^1.5 rounded to nearest 10 for levels 1-30", () => {
    for (let n = 1; n <= 30; n++) {
      const expected = Math.round((100 * Math.pow(n, 1.5)) / 10) * 10;
      expect(xpThresholdForLevel(n)).toBe(expected);
    }
  });

  it("known thresholds", () => {
    expect(xpThresholdForLevel(1)).toBe(100);
    expect(xpThresholdForLevel(10)).toBe(3160);
    expect(xpThresholdForLevel(25)).toBe(12500);
    expect(xpThresholdForLevel(30)).toBe(16430);
  });

  it("levelForXp is correct at exact boundaries", () => {
    const t10 = xpThresholdForLevel(10);
    expect(levelForXp(t10 - 1)).toBe(9);
    expect(levelForXp(t10)).toBe(10);
    expect(levelForXp(t10 + 1)).toBe(10);
  });

  it("levelForXp never exceeds maxLevel", () => {
    expect(levelForXp(10_000_000)).toBe(DEFAULT_LEVEL_CURVE.maxLevel);
  });

  it("xp 0 is level 1", () => {
    expect(levelForXp(0)).toBe(1);
  });

  it("rank name boundaries", () => {
    expect(rankForLevel(1)).toBe("Climber");
    expect(rankForLevel(5)).toBe("Climber");
    expect(rankForLevel(6)).toBe("Pathfinder");
    expect(rankForLevel(10)).toBe("Pathfinder");
    expect(rankForLevel(11)).toBe("Rope Leader");
    expect(rankForLevel(15)).toBe("Rope Leader");
    expect(rankForLevel(16)).toBe("Ridge Captain");
    expect(rankForLevel(20)).toBe("Ridge Captain");
    expect(rankForLevel(21)).toBe("Summit Ready");
    expect(rankForLevel(30)).toBe("Summit Ready");
  });

  it("multiplier scales thresholds proportionally", () => {
    const scaled = { ...DEFAULT_LEVEL_CURVE, multiplier: 2 };
    expect(xpThresholdForLevel(10, scaled)).toBe(xpThresholdForLevel(10) * 2);
  });

  it("xpToNextLevel reports remaining XP correctly and null at max level", () => {
    const r = xpToNextLevel(0);
    expect(r.level).toBe(1);
    expect(r.nextLevel).toBe(2);
    expect(r.xpNeededForNext).toBe(xpThresholdForLevel(2));

    const atMax = xpToNextLevel(xpThresholdForLevel(30) + 5000);
    expect(atMax.level).toBe(30);
    expect(atMax.nextLevel).toBeNull();
    expect(atMax.xpNeededForNext).toBeNull();
  });
});
