CREATE INDEX CONCURRENTLY "Game_endAt_playerId_title_isWin_idx"
ON "Game"("endAt" DESC, "playerId", "title", "isWin")
WHERE "isWin" = true;
