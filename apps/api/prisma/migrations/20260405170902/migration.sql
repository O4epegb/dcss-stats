-- CreateIndex
CREATE INDEX "Highscore_breakdown_runeTier_score_idx" ON "Highscore"("breakdown", "runeTier", "score" DESC);

-- CreateIndex
CREATE INDEX "Highscore_playerId_idx" ON "Highscore"("playerId");
