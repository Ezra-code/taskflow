/*
  Warnings:

  - Added the required column `accountEmail` to the `OAuthConnection` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OAuthConnection" ADD COLUMN     "accountEmail" TEXT NOT NULL;
