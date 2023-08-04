/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "email" STRING NOT NULL;
ALTER TABLE "User" ALTER COLUMN "picture" SET DEFAULT 'https://popcat.click/twitter-card.jpg';
ALTER TABLE "User" ALTER COLUMN "bio" SET DEFAULT 'im a noob';
ALTER TABLE "User" ALTER COLUMN "elo" SET DEFAULT 1200;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
