-- DropIndex
DROP INDEX "WantedListing_status_createdAt_idx";

-- AlterTable
ALTER TABLE "WantedListing" ADD COLUMN     "moderation" "ModerationStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "WantedListing_status_moderation_createdAt_idx" ON "WantedListing"("status", "moderation", "createdAt");
