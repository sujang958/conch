/*
  Warnings:

  - You are about to drop the column `elo` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "elo",
ADD COLUMN     "blitzElo" INTEGER NOT NULL DEFAULT 1200,
ADD COLUMN     "bulletElo" INTEGER NOT NULL DEFAULT 1200,
ADD COLUMN     "country" TEXT NOT NULL DEFAULT '🏁',
ADD COLUMN     "rapidElo" INTEGER NOT NULL DEFAULT 1200;
