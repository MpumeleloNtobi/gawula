-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL,
    "percentOff" INTEGER NOT NULL DEFAULT 0,
    "amountOffCents" INTEGER NOT NULL DEFAULT 0,
    "minSpendCents" INTEGER NOT NULL DEFAULT 0,
    "paused" BOOLEAN NOT NULL DEFAULT false,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "redemptionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Promotion_outletId_idx" ON "Promotion"("outletId");

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
