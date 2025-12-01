-- DropIndex
DROP INDEX "Game_playerId_idx";

-- DropIndex
DROP INDEX "Game_versionInteger_idx";

-- CreateIndex
CREATE INDEX "Game_versionInteger_endAt_idx" ON "Game"("versionInteger", "endAt");
