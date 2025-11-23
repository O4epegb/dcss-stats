/*
  Warnings:

  - You are about to drop the column `streakId` on the `Game` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Game" DROP CONSTRAINT "Game_streakId_fkey";

-- AlterTable
ALTER TABLE "Game" DROP COLUMN "streakId";

-- CreateTable
CREATE TABLE "StreakGame" (
    "id" TEXT NOT NULL,
    "streakId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,

    CONSTRAINT "StreakGame_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StreakGame_gameId_idx" ON "StreakGame"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "StreakGame_streakId_gameId_key" ON "StreakGame"("streakId", "gameId");

-- AddForeignKey
ALTER TABLE "StreakGame" ADD CONSTRAINT "StreakGame_streakId_fkey" FOREIGN KEY ("streakId") REFERENCES "Streak"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreakGame" ADD CONSTRAINT "StreakGame_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
