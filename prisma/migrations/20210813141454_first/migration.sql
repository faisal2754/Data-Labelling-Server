-- CreateTable
CREATE TABLE "User" (
    "user_id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatar" TEXT,
    "balance" INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Job" (
    "job_id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "job_owner_id" INTEGER NOT NULL,

    PRIMARY KEY ("job_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User.email_unique" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Job" ADD FOREIGN KEY ("job_owner_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
