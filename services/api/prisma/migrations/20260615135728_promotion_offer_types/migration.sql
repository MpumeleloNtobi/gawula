-- AlterTable
ALTER TABLE "Promotion" ADD COLUMN     "buyItemId" TEXT,
ADD COLUMN     "buyQuantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "days" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "endTime" TEXT,
ADD COLUMN     "freeItemId" TEXT,
ADD COLUMN     "getItemId" TEXT,
ADD COLUMN     "getQuantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "startTime" TEXT;
