-- AlterTable
ALTER TABLE "User" ADD COLUMN     "recentlyViewedIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
