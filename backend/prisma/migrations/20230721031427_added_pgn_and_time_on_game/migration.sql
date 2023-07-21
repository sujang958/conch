/*
  Warnings:

  - You are about to drop the column `startedAt` on the `Game` table. All the data in the column will be lost.
  - Added the required column `increment` to the `Game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pgn` to the `Game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `time` to the `Game` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Game" DROP COLUMN "startedAt";
ALTER TABLE "Game" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Game" ADD COLUMN     "increment" INT4 NOT NULL;
ALTER TABLE "Game" ADD COLUMN     "pgn" STRING NOT NULL;
ALTER TABLE "Game" ADD COLUMN     "time" INT4 NOT NULL;
