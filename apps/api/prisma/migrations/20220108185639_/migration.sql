/*
  Warnings:

  - Made the column `dex` on table `Game` required. This step will fail if there are existing NULL values in that column.
  - Made the column `int` on table `Game` required. This step will fail if there are existing NULL values in that column.
  - Made the column `name` on table `Game` required. This step will fail if there are existing NULL values in that column.
  - Made the column `str` on table `Game` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Game" ALTER COLUMN "dex" SET NOT NULL,
ALTER COLUMN "int" SET NOT NULL,
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "str" SET NOT NULL;
