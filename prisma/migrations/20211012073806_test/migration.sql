/*
  Warnings:

  - You are about to drop the column `is_complete` on the `job_labeller` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "job_labeller" DROP COLUMN "is_complete";

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "balance" SET DEFAULT 0;
