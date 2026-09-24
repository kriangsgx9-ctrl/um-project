// A minimal in-memory fake of the slice of PrismaClient the game engine actually
// calls (xpEvent, userProgress, gameSettings, $transaction). This lets xp-engine /
// reversal / recalculate be unit-tested for real anti-gaming behavior (dedupe,
// caps, atomic progress updates) without a live Postgres instance — see the
// Sprint A/B report for why: this sandbox has no local Postgres/Docker available.
// It is NOT a substitute for integration tests against real Postgres before
// shipping (Serializable-transaction retry behavior in particular can only be
// verified against the real engine).
import { Prisma } from "@prisma/client";

export interface FakeXpEventRow {
  id: string;
  userId: string;
  type: string;
  amount: number;
  sourceType: string;
  sourceId: string;
  reason: string | null;
  createdAt: Date;
}

export interface FakeUserProgressRow {
  userId: string;
  xp: number;
  level: number;
  streak: number;
  bestStreak: number;
  shieldsLeft: number;
  lastActiveDate: string | null;
  weeklyReviewStreak: number;
  weeklyReviewBestStreak: number;
  lastWeeklyReviewWeek: string | null;
}

function uniqueViolation(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "test",
  });
}

export class FakePrisma {
  xpEvents: FakeXpEventRow[] = [];
  progress = new Map<string, FakeUserProgressRow>();
  gameSettingsRow: { xpTable: unknown; caps: unknown; levelCurve: unknown; leaderboardOn: boolean; kudosOn: boolean } | null = null;
  private seq = 0;

  gameSettings = {
    findUnique: async () => this.gameSettingsRow,
  };

  xpEvent = {
    create: async ({ data }: { data: Omit<FakeXpEventRow, "id"> & { id?: string } }) => {
      const dup = this.xpEvents.find(
        (e) => e.userId === data.userId && e.type === data.type && e.sourceType === data.sourceType && e.sourceId === data.sourceId
      );
      if (dup) throw uniqueViolation();
      const row: FakeXpEventRow = { ...data, id: data.id ?? `xpe_${++this.seq}` };
      this.xpEvents.push(row);
      return row;
    },
    count: async ({ where }: { where: { userId: string; type: string; createdAt: { gte: Date; lt: Date } } }) =>
      this.xpEvents.filter(
        (e) =>
          e.userId === where.userId &&
          e.type === where.type &&
          e.createdAt.getTime() >= where.createdAt.gte.getTime() &&
          e.createdAt.getTime() < where.createdAt.lt.getTime()
      ).length,
    findUnique: async ({
      where,
    }: {
      where: { userId_type_sourceType_sourceId: { userId: string; type: string; sourceType: string; sourceId: string } };
    }) => {
      const k = where.userId_type_sourceType_sourceId;
      return this.xpEvents.find((e) => e.userId === k.userId && e.type === k.type && e.sourceType === k.sourceType && e.sourceId === k.sourceId) ?? null;
    },
    findMany: async ({ where }: { where: { userId: string }; orderBy?: unknown }) =>
      this.xpEvents.filter((e) => e.userId === where.userId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
  };

  userProgress = {
    findUnique: async ({ where }: { where: { userId: string } }) => this.progress.get(where.userId) ?? null,
    create: async ({ data }: { data: Partial<FakeUserProgressRow> & { userId: string } }) => {
      const row = defaultProgress(data.userId, data);
      this.progress.set(data.userId, row);
      return row;
    },
    update: async ({ where, data }: { where: { userId: string }; data: Partial<FakeUserProgressRow> }) => {
      const current = this.progress.get(where.userId);
      if (!current) throw new Error(`no progress row for ${where.userId}`);
      const updated = { ...current, ...data };
      this.progress.set(where.userId, updated);
      return updated;
    },
    upsert: async ({
      where,
      create,
      update,
    }: {
      where: { userId: string };
      create: Partial<FakeUserProgressRow> & { userId: string };
      update: Partial<FakeUserProgressRow>;
    }) => {
      const current = this.progress.get(where.userId);
      const row = current ? { ...current, ...update } : defaultProgress(where.userId, create);
      this.progress.set(where.userId, row);
      return row;
    },
  };

  async $transaction<T>(fn: (tx: this) => Promise<T>): Promise<T> {
    return fn(this);
  }
}

function defaultProgress(userId: string, overrides: Partial<FakeUserProgressRow>): FakeUserProgressRow {
  return {
    userId,
    xp: 0,
    level: 1,
    streak: 0,
    bestStreak: 0,
    shieldsLeft: 1,
    lastActiveDate: null,
    weeklyReviewStreak: 0,
    weeklyReviewBestStreak: 0,
    lastWeeklyReviewWeek: null,
    ...overrides,
  };
}
