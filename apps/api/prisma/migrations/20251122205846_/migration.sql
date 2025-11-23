-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "streakId" TEXT;

-- CreateTable
CREATE TABLE "Streak" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "length" INTEGER NOT NULL,
    "isBroken" BOOLEAN NOT NULL,

    CONSTRAINT "Streak_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Streak_playerId_endedAt_idx" ON "Streak"("playerId", "endedAt");

-- CreateIndex
CREATE INDEX "Streak_length_endedAt_idx" ON "Streak"("length", "endedAt");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_streakId_fkey" FOREIGN KEY ("streakId") REFERENCES "Streak"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Streak" ADD CONSTRAINT "Streak_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
