-- CreateTable
CREATE TABLE "RiderApplication" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "areaLabel" TEXT NOT NULL,
    "waitlisted" BOOLEAN NOT NULL DEFAULT false,
    "vehicleType" TEXT NOT NULL,
    "hasSmartphone" BOOLEAN NOT NULL DEFAULT true,
    "idNumber" TEXT NOT NULL,
    "idFrontDocName" TEXT,
    "idBackDocName" TEXT,
    "selfieDocName" TEXT,
    "fullBodyDocName" TEXT,
    "licenceDocName" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'submitted',
    "rejectionReason" TEXT,
    "reviewerId" TEXT,
    "riderId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiderApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiderPasswordResetToken" (
    "id" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiderPasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RiderApplication_riderId_key" ON "RiderApplication"("riderId");

-- CreateIndex
CREATE INDEX "RiderApplication_stage_idx" ON "RiderApplication"("stage");

-- CreateIndex
CREATE UNIQUE INDEX "RiderPasswordResetToken_tokenHash_key" ON "RiderPasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RiderPasswordResetToken_riderId_idx" ON "RiderPasswordResetToken"("riderId");

-- AddForeignKey
ALTER TABLE "RiderApplication" ADD CONSTRAINT "RiderApplication_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderPasswordResetToken" ADD CONSTRAINT "RiderPasswordResetToken_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
