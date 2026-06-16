-- AlterTable
ALTER TABLE "Promotion" ADD COLUMN     "category" TEXT,
ADD COLUMN     "itemIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
