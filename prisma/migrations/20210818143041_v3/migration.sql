/*
  Warnings:

  - You are about to drop the column `ground_truth` on the `job_image` table. All the data in the column will be lost.
  - You are about to drop the column `job_id` on the `job_image` table. All the data in the column will be lost.
  - The primary key for the `job_labeller` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `credits` to the `job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `partition_id` to the `job_image` table without a default value. This is not possible if the table is not empty.
  - Added the required column `partition_id` to the `job_labeller` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "job_image" DROP CONSTRAINT "job_image_job_id_fkey";

-- AlterTable
ALTER TABLE "job" ADD COLUMN     "credits" INTEGER NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "job_image" DROP COLUMN "ground_truth",
DROP COLUMN "job_id",
ADD COLUMN     "partition_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "job_labeller" DROP CONSTRAINT "job_labeller_pkey",
ADD COLUMN     "partition_id" INTEGER NOT NULL,
ADD PRIMARY KEY ("job_id", "user_id", "partition_id");

-- CreateTable
CREATE TABLE "job_partition" (
    "partition_id" SERIAL NOT NULL,
    "partition_number" INTEGER NOT NULL,
    "is_full" BOOLEAN NOT NULL DEFAULT false,
    "job_id" INTEGER NOT NULL,

    PRIMARY KEY ("partition_id")
);

-- AddForeignKey
ALTER TABLE "job_labeller" ADD FOREIGN KEY ("partition_id") REFERENCES "job_partition"("partition_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_image" ADD FOREIGN KEY ("partition_id") REFERENCES "job_partition"("partition_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_partition" ADD FOREIGN KEY ("job_id") REFERENCES "job"("job_id") ON DELETE CASCADE ON UPDATE CASCADE;
