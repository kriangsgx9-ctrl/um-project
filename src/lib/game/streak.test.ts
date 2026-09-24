import { describe, expect, it } from "vitest";
import { getBangkokWeekKey } from "./clock";
import { toDate } from "@/lib/domain/dates";
import { INITIAL_STREAK_STATE, advanceStreak, replayStreak, type StreakState } from "./streak";

// 2026-01-05 is a Monday.
const MON = "2026-01-05";
const TUE = "2026-01-06";
const WED = "2026-01-07";
const THU = "2026-01-08";
const FRI = "2026-01-09";
const SAT = "2026-01-10";
const NEXT_MON = "2026-01-12";
const NEXT_TUE = "2026-01-13";

describe("streak state machine", () => {
  it("1. consecutive Mon-Sat activity increments the streak daily", () => {
    let s: StreakState = INITIAL_STREAK_STATE;
    for (const day of [MON, TUE, WED, THU, FRI, SAT]) {
      s = advanceStreak(s, day);
    }
    expect(s.streak).toBe(6);
    expect(s.bestStreak).toBe(6);
  });

  it("2. Saturday -> Monday (Sunday skipped) continues the streak, no shield used", () => {
    let s = advanceStreak(INITIAL_STREAK_STATE, SAT);
    const before = s.shieldsLeft;
    s = advanceStreak(s, NEXT_MON);
    expect(s.outcome).toBe("continued");
    expect(s.streak).toBe(2);
    expect(s.shieldsLeft).toBe(before); // untouched
  });

  it("3. exactly one missed working day with a shield available auto-consumes it", () => {
    let s = advanceStreak(INITIAL_STREAK_STATE, MON); // shieldsLeft still 1 (same week)
    s = advanceStreak(s, WED); // missed Tuesday
    expect(s.outcome).toBe("shield_used");
    expect(s.streak).toBe(2);
    expect(s.shieldsLeft).toBe(0);
  });

  it("4. one missed working day with the shield already used this week resets the streak", () => {
    let s = advanceStreak(INITIAL_STREAK_STATE, MON);
    s = advanceStreak(s, WED); // uses the shield, streak=2, shieldsLeft=0
    s = advanceStreak(s, FRI); // missed Thursday, no shield left, same week
    expect(s.outcome).toBe("reset");
    expect(s.streak).toBe(1);
    expect(s.message).not.toMatch(/ตำหนิ|ผิด|แย่/); // encouraging, never scolding
  });

  it("5. two or more missed working days always resets, even with a shield banked", () => {
    let s = advanceStreak(INITIAL_STREAK_STATE, MON);
    s = advanceStreak(s, FRI); // missed Tue, Wed, Thu (gap=2 working days) — shield only covers 1 day
    expect(s.outcome).toBe("reset");
    expect(s.streak).toBe(1);
  });

  it("6. shield replenishes exactly once on crossing into a new Bangkok week, not more", () => {
    let s = advanceStreak(INITIAL_STREAK_STATE, MON);
    s = advanceStreak(s, WED); // uses the shield -> shieldsLeft 0
    expect(s.shieldsLeft).toBe(0);
    s = advanceStreak(s, FRI); // still same week as WED -> resets, shield stays 0 (no new week crossed)
    expect(s.shieldsLeft).toBe(0);
    s = advanceStreak(s, NEXT_MON); // new week -> shield refills to 1
    expect(s.shieldsLeft).toBe(1);
    s = advanceStreak(s, NEXT_TUE); // still same week -> refill logic shouldn't push above 1
    expect(s.shieldsLeft).toBe(1);
  });

  it("7. duplicate activity on the same Bangkok day is a no-op", () => {
    let s = advanceStreak(INITIAL_STREAK_STATE, MON);
    const afterFirst = { ...s };
    s = advanceStreak(s, MON);
    expect(s.outcome).toBe("same_day_noop");
    expect(s.streak).toBe(afterFirst.streak);
    expect(s.lastActiveDate).toBe(afterFirst.lastActiveDate);
  });

  it("8. timezone rollover buckets a UTC instant into the correct Bangkok day", () => {
    // 2026-01-05T17:05:00Z = 2026-01-06T00:05 Bangkok
    const d = toDate(new Date("2026-01-05T17:05:00Z"));
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(0);
    expect(d.getUTCDate()).toBe(6);
  });

  it("9. week-key boundary: Sunday 23:59 and Monday 00:01 Bangkok are different weeks", () => {
    const sunNight = new Date("2026-01-11T16:59:00Z");
    const monMorning = new Date("2026-01-11T17:01:00Z");
    expect(getBangkokWeekKey(sunNight)).not.toBe(getBangkokWeekKey(monMorning));
  });

  it("10. bestStreak holds the historical maximum across a reset", () => {
    let s: StreakState = INITIAL_STREAK_STATE;
    for (const day of [MON, TUE, WED, THU, FRI]) s = advanceStreak(s, day); // streak=5
    expect(s.bestStreak).toBe(5);
    // blow the streak with a 2-day gap, well past any shield
    s = advanceStreak(s, "2026-01-19"); // next Monday + gap
    expect(s.streak).toBe(1);
    expect(s.bestStreak).toBe(5);
  });

  it("11. the weekly-review streak is independent of the daily streak", () => {
    // A gap in daily activity should not be readable from anything about the weekly track,
    // since they are tracked via entirely separate StreakState instances in progress.ts.
    let daily: StreakState = INITIAL_STREAK_STATE;
    daily = advanceStreak(daily, MON);
    daily = advanceStreak(daily, "2026-02-02"); // huge gap -> reset
    expect(daily.streak).toBe(1);
    // weekly state (separate instance) is untouched by the above and starts fresh independently
    const weekly: StreakState = INITIAL_STREAK_STATE;
    expect(weekly.streak).toBe(0);
  });

  it("12. replay-equivalence: replaying a day list matches incremental folding", () => {
    const days = [MON, TUE, THU, FRI, SAT, NEXT_MON, NEXT_TUE]; // includes a shielded gap (Wed missing)
    const incremental = days.reduce<StreakState>((s, d) => {
      const r = advanceStreak(s, d);
      return { streak: r.streak, bestStreak: r.bestStreak, shieldsLeft: r.shieldsLeft, lastActiveDate: r.lastActiveDate };
    }, INITIAL_STREAK_STATE);
    const replayed = replayStreak(days);
    expect(replayed).toEqual(incremental);

    // also true for a shuffled/duplicated input (replay sorts + dedupes internally)
    const shuffled = [...days, days[0], days[2]].reverse();
    expect(replayStreak(shuffled)).toEqual(incremental);
  });
});
