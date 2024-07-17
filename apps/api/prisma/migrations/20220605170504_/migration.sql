-- CreateIndex
CREATE INDEX "Game_playerId_endAt_idx" ON "Game"("playerId", "endAt");

-- CreateIndex
CREATE INDEX "Game_endAt_idx" ON "Game"("endAt");
