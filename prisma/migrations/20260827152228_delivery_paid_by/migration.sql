-- CreateEnum
CREATE TYPE "DeliveryPayer" AS ENUM ('FARMER', 'BUYER');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "deliveryPaidBy" "DeliveryPayer";

-- Backfill from the old fixed-fee column before dropping it: null/zero meant
-- free (farmer-paid), any positive fee meant the buyer covered it.
UPDATE "Product" SET "deliveryPaidBy" = CASE
  WHEN "deliveryAvailable" = false THEN NULL
  WHEN "deliveryFeeMinor" IS NULL OR "deliveryFeeMinor" = 0 THEN 'FARMER'
  ELSE 'BUYER'
END::"DeliveryPayer";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "deliveryFeeMinor";
