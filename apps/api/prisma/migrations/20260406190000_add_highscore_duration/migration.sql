-- AlterEnum
ALTER TYPE "HighscoreKind" ADD VALUE 'DURATION';

-- Add duration column
ALTER TABLE "Highscore" ADD COLUMN "duration" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Highscore" ALTER COLUMN "duration" DROP DEFAULT;

-- Create duration index
CREATE INDEX "Highscore_kind_breakdown_runeTier_duration_idx" ON "Highscore" ("kind", "breakdown", "runeTier", "duration" ASC);
