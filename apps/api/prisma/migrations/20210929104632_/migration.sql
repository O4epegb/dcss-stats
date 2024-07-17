-- DropForeignKey
ALTER TABLE "DuplicateGame" DROP CONSTRAINT "DuplicateGame_logfileId_fkey";

-- DropForeignKey
ALTER TABLE "Game" DROP CONSTRAINT "Game_logfileId_fkey";

-- DropForeignKey
ALTER TABLE "Game" DROP CONSTRAINT "Game_playerId_fkey";

-- DropForeignKey
ALTER TABLE "InvalidGame" DROP CONSTRAINT "InvalidGame_logfileId_fkey";

-- DropForeignKey
ALTER TABLE "Logfile" DROP CONSTRAINT "Logfile_serverId_fkey";

-- AddForeignKey
ALTER TABLE "Logfile" ADD CONSTRAINT "Logfile_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_logfileId_fkey" FOREIGN KEY ("logfileId") REFERENCES "Logfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuplicateGame" ADD CONSTRAINT "DuplicateGame_logfileId_fkey" FOREIGN KEY ("logfileId") REFERENCES "Logfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvalidGame" ADD CONSTRAINT "InvalidGame_logfileId_fkey" FOREIGN KEY ("logfileId") REFERENCES "Logfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "Class.abbr_unique" RENAME TO "Class_abbr_key";

-- RenameIndex
ALTER INDEX "Class.name_unique" RENAME TO "Class_name_key";

-- RenameIndex
ALTER INDEX "Game.playerId_index" RENAME TO "Game_playerId_idx";

-- RenameIndex
ALTER INDEX "Game.playerId_startAt_index" RENAME TO "Game_playerId_startAt_idx";

-- RenameIndex
ALTER INDEX "God.name_unique" RENAME TO "God_name_key";

-- RenameIndex
ALTER INDEX "Logfile.serverId_path_unique" RENAME TO "Logfile_serverId_path_key";

-- RenameIndex
ALTER INDEX "Player.name_unique" RENAME TO "Player_name_key";

-- RenameIndex
ALTER INDEX "Race.abbr_unique" RENAME TO "Race_abbr_key";

-- RenameIndex
ALTER INDEX "Race.name_unique" RENAME TO "Race_name_key";

-- RenameIndex
ALTER INDEX "Server.abbreviation_unique" RENAME TO "Server_abbreviation_key";

-- RenameIndex
ALTER INDEX "Server.name_unique" RENAME TO "Server_name_key";

-- RenameIndex
ALTER INDEX "Server.url_unique" RENAME TO "Server_url_key";
