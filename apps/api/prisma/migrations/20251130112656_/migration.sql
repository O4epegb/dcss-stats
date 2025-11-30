-- DropForeignKey
ALTER TABLE "StreakGame" DROP CONSTRAINT "StreakGame_gameId_fkey";

-- DropForeignKey
ALTER TABLE "StreakGame" DROP CONSTRAINT "StreakGame_streakId_fkey";

-- AddForeignKey
ALTER TABLE "StreakGame" ADD CONSTRAINT "StreakGame_streakId_fkey" FOREIGN KEY ("streakId") REFERENCES "Streak"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreakGame" ADD CONSTRAINT "StreakGame_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
