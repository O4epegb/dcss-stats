-- CreateEnum
CREATE TYPE "HighscoreKind" AS ENUM ('HIGHSCORE', 'TURN_COUNT');

-- Add nullable columns
ALTER TABLE "Highscore" ADD COLUMN "kind" "HighscoreKind";
ALTER TABLE "Highscore" ADD COLUMN "turns" INTEGER;

-- Backfill existing rows
UPDATE "Highscore" SET "kind" = 'HIGHSCORE', "turns" = 0 WHERE "kind" IS NULL;

-- Make NOT NULL
ALTER TABLE "Highscore" ALTER COLUMN "kind" SET NOT NULL;
ALTER TABLE "Highscore" ALTER COLUMN "turns" SET NOT NULL;

-- Drop old PK and add new one
ALTER TABLE "Highscore" DROP CONSTRAINT "Highscore_pkey";
ALTER TABLE "Highscore" ADD CONSTRAINT "Highscore_pkey" PRIMARY KEY ("gameId", "kind", "breakdown", "runeTier");

-- Drop old index, create new indexes
DROP INDEX IF EXISTS "Highscore_breakdown_runeTier_score_idx";
CREATE INDEX "Highscore_kind_breakdown_runeTier_score_idx" ON "Highscore" ("kind", "breakdown", "runeTier", "score" DESC);
CREATE INDEX "Highscore_kind_breakdown_runeTier_turns_idx" ON "Highscore" ("kind", "breakdown", "runeTier", "turns" ASC);
