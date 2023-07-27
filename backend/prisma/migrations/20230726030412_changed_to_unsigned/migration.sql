/*
  Warnings:

  - You are about to alter the column `increment` on the `Game` table. The data in that column could be lost. The data in that column will be cast from `Int4` to `Unsupported("Int4 UNSIGNED")`.
  - You are about to alter the column `time` on the `Game` table. The data in that column could be lost. The data in that column will be cast from `Int4` to `Unsupported("Int4 UNSIGNED")`.

*/
-- AlterTable
ALTER TABLE "Game" ALTER COLUMN "increment" SET DATA TYPE Int4;
ALTER TABLE "Game" ALTER COLUMN "time" SET DATA TYPE Int4;
