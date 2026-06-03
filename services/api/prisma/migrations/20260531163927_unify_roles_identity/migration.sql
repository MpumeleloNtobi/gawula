/*
  Warnings:

  - You are about to drop the column `email` on the `Rider` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `Rider` table. All the data in the column will be lost.
  - You are about to drop the `RiderPasswordResetToken` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[customerId]` on the table `Rider` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `customerId` to the `Rider` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "RiderPasswordResetToken" DROP CONSTRAINT "RiderPasswordResetToken_riderId_fkey";

-- DropIndex
DROP INDEX "Rider_email_key";

-- DropIndex
DROP INDEX "Rider_phone_key";

-- AlterTable
ALTER TABLE "Rider" DROP COLUMN "email",
DROP COLUMN "passwordHash",
ADD COLUMN     "customerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "RiderApplication" ADD COLUMN     "customerId" TEXT;

-- DropTable
DROP TABLE "RiderPasswordResetToken";

-- CreateTable
CREATE TABLE "RoleGrant" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "complexId" TEXT,
    "outletId" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "RoleGrant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoleGrant_customerId_idx" ON "RoleGrant"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "RoleGrant_customerId_role_key" ON "RoleGrant"("customerId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "Rider_customerId_key" ON "Rider"("customerId");

-- CreateIndex
CREATE INDEX "RiderApplication_customerId_idx" ON "RiderApplication"("customerId");

-- AddForeignKey
ALTER TABLE "RoleGrant" ADD CONSTRAINT "RoleGrant_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rider" ADD CONSTRAINT "Rider_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderApplication" ADD CONSTRAINT "RiderApplication_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
