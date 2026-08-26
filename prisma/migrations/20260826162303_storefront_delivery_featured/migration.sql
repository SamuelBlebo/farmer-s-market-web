-- AlterTable
ALTER TABLE "FarmerProfile" ADD COLUMN     "coverImage" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "deliveryAvailable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deliveryFeeMinor" INTEGER,
ADD COLUMN     "deliveryRadiusKm" INTEGER,
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Product_featured_status_moderation_idx" ON "Product"("featured", "status", "moderation");
