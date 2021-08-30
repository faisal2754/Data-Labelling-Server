/*
  Warnings:

  - Added the required column `labellers_per_partition` to the `job` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "job" ADD COLUMN     "labellers_per_partition" INTEGER NOT NULL;
