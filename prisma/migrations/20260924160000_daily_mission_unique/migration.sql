-- Makes Daily Mission generation idempotent: one mission per kind per user per day.
ALTER TABLE "DailyMission" ADD CONSTRAINT "DailyMission_userId_date_kind_key" UNIQUE ("userId", "date", "kind");
