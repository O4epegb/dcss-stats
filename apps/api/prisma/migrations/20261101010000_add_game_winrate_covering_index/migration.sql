CREATE INDEX CONCURRENTLY "Game_endAt_playerId_isWin_idx"
ON "Game"("endAt", "playerId", "isWin");
