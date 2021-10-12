-- AlterTable
ALTER TABLE "job_labeller" ADD COLUMN     "is_complete" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "balance" SET DEFAULT 5000;
