/*
  Warnings:

  - You are about to drop the `Job` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Job" DROP CONSTRAINT "Job_job_owner_id_fkey";

-- DropTable
DROP TABLE "Job";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "user" (
    "user_id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatar" TEXT,
    "balance" INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "job" (
    "job_id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "job_owner_id" INTEGER NOT NULL,

    PRIMARY KEY ("job_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user.email_unique" ON "user"("email");

-- AddForeignKey
ALTER TABLE "job" ADD FOREIGN KEY ("job_owner_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
