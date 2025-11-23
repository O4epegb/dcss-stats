/*
  Warnings:

  - You are about to drop the column `isUniqueByChar` on the `Streak` table. All the data in the column will be lost.
  - Added the required column `type` to the `Streak` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StreakType" AS ENUM ('UNIQUE', 'MIXED', 'MONO');

-- DropIndex
DROP INDEX "Streak_length_endedAt_idx";

-- DropIndex
DROP INDEX "Streak_playerId_endedAt_idx";

-- AlterTable
ALTER TABLE "Streak" DROP COLUMN "isUniqueByChar",
ADD COLUMN     "type" "StreakType" NOT NULL,
ALTER COLUMN "endedAt" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Streak_playerId_idx" ON "Streak"("playerId");

-- CreateIndex
CREATE INDEX "Streak_length_idx" ON "Streak"("length");

-- CreateIndex
CREATE INDEX "Streak_type_idx" ON "Streak"("type");
