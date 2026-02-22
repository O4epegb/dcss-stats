-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "serverAbbreviation" TEXT;

-- CreateIndex
CREATE INDEX "Game_serverAbbreviation_endAt_id_idx" ON "Game"("serverAbbreviation", "endAt" DESC, "id" DESC);
