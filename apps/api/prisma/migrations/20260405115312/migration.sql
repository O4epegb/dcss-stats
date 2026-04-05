-- CreateEnum
CREATE TYPE "HighscoreBreakdown" AS ENUM ('CLASS', 'RACE', 'CHAR');

-- CreateEnum
CREATE TYPE "HighscoreRuneTier" AS ENUM ('ALL', 'THREE_RUNES', 'FOUR_PLUS_RUNES');

-- CreateTable
CREATE TABLE "Highscore" (
    "gameId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "breakdown" "HighscoreBreakdown" NOT NULL,
    "runeTier" "HighscoreRuneTier" NOT NULL,
    "normalizedClass" TEXT NOT NULL,
    "normalizedRace" TEXT NOT NULL,
    "char" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "runes" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,

    CONSTRAINT "Highscore_pkey" PRIMARY KEY ("gameId","breakdown","runeTier")
);

-- AddForeignKey
ALTER TABLE "Highscore" ADD CONSTRAINT "Highscore_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Highscore" ADD CONSTRAINT "Highscore_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
