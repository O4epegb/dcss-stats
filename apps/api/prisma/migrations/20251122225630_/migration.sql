/*
  Warnings:

  - Added the required column `isUniqueByChar` to the `Streak` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Streak" ADD COLUMN     "isUniqueByChar" BOOLEAN NOT NULL;
