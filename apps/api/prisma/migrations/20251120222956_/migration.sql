/*
  Warnings:

  - You are about to drop the `DuplicateGame` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DuplicateGame" DROP CONSTRAINT "DuplicateGame_logfileId_fkey";

-- DropTable
DROP TABLE "DuplicateGame";
