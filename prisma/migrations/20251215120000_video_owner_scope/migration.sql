-- DropIndex
DROP INDEX "Video_filename_key";

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "ownerId" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "Video_ownerId_idx" ON "Video"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Video_ownerId_filename_key" ON "Video"("ownerId", "filename");
