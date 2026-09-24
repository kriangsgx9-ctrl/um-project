// Loads GameSettings from the DB and deep-merges it over the shipped defaults, so
// the engine never has to deal with a partially-configured settings row.
import type { Prisma, PrismaClient } from "@prisma/client";
import { DEFAULT_CAPS, type CapsConfig } from "./caps";
import { DEFAULT_LEVEL_CURVE, type LevelCurveConfig } from "./level";
import { DEFAULT_XP_TABLE, type XpTable } from "./xp-table";

export interface ResolvedGameSettings {
  xpTable: XpTable;
  caps: CapsConfig;
  levelCurve: LevelCurveConfig;
  leaderboardOn: boolean;
  kudosOn: boolean;
}

type Db = PrismaClient | Prisma.TransactionClient;

export async function getGameSettings(db: Db): Promise<ResolvedGameSettings> {
  const row = await db.gameSettings.findUnique({ where: { id: "default" } });
  return {
    xpTable: { ...DEFAULT_XP_TABLE, ...((row?.xpTable as Partial<XpTable>) ?? {}) },
    caps: { ...DEFAULT_CAPS, ...((row?.caps as CapsConfig) ?? {}) },
    levelCurve: { ...DEFAULT_LEVEL_CURVE, ...((row?.levelCurve as Partial<LevelCurveConfig>) ?? {}) },
    leaderboardOn: row?.leaderboardOn ?? true,
    kudosOn: row?.kudosOn ?? true,
  };
}
