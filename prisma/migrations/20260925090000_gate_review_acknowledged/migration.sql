-- Lets the Victory screen show exactly once per approved gate.
ALTER TABLE "GateReview" ADD COLUMN "acknowledgedAt" TIMESTAMP(3);
