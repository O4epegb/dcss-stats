-- AlterTable
ALTER TABLE "Highscore" ADD COLUMN "points" INTEGER NOT NULL DEFAULT 0;

-- Backfill existing rows
UPDATE "Highscore" SET "points" = GREATEST(0, 11 - "rank");

-- Remove default (new inserts must provide points explicitly)
ALTER TABLE "Highscore" ALTER COLUMN "points" DROP DEFAULT;
