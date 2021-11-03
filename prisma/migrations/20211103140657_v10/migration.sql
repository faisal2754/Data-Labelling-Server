-- CreateTable
CREATE TABLE "deleted_jobs" (
    "user_id" INTEGER NOT NULL,
    "job_id" INTEGER NOT NULL,

    PRIMARY KEY ("user_id","job_id")
);

-- AddForeignKey
ALTER TABLE "deleted_jobs" ADD FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deleted_jobs" ADD FOREIGN KEY ("job_id") REFERENCES "job"("job_id") ON DELETE CASCADE ON UPDATE CASCADE;
