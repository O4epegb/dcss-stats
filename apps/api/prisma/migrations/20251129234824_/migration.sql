-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "versionInteger" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Game_versionInteger_idx" ON "Game"("versionInteger");
