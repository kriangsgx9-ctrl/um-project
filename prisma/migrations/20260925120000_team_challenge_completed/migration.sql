-- Marks a Team Expedition as already paid out once its combined target is reached.
ALTER TABLE "TeamChallenge" ADD COLUMN "completedAt" TIMESTAMP(3);
