-- CreateTable
CREATE TABLE "job_labeller" (
    "job_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    PRIMARY KEY ("job_id","user_id")
);

-- CreateTable
CREATE TABLE "job_label" (
    "label_id" SERIAL NOT NULL,
    "job_id" INTEGER NOT NULL,
    "label" TEXT NOT NULL,

    PRIMARY KEY ("label_id")
);

-- CreateTable
CREATE TABLE "job_image" (
    "image_id" SERIAL NOT NULL,
    "job_id" INTEGER NOT NULL,
    "image_uri" TEXT NOT NULL,
    "ground_truth" TEXT,

    PRIMARY KEY ("image_id")
);

-- CreateTable
CREATE TABLE "image_label" (
    "user_id" INTEGER NOT NULL,
    "image_id" INTEGER NOT NULL,
    "label" TEXT NOT NULL,

    PRIMARY KEY ("user_id","image_id")
);

-- AddForeignKey
ALTER TABLE "job_labeller" ADD FOREIGN KEY ("job_id") REFERENCES "job"("job_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_labeller" ADD FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_label" ADD FOREIGN KEY ("job_id") REFERENCES "job"("job_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_image" ADD FOREIGN KEY ("job_id") REFERENCES "job"("job_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_label" ADD FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_label" ADD FOREIGN KEY ("image_id") REFERENCES "job_image"("image_id") ON DELETE CASCADE ON UPDATE CASCADE;
