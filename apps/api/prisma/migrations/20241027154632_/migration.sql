-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "gems" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "intactGems" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "killerType" TEXT;
