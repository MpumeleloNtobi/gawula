-- AlterTable
ALTER TABLE "SubOrder" ADD COLUMN     "pickupAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pickupLockedUntil" TIMESTAMP(3);
