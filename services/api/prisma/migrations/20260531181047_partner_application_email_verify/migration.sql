-- CreateTable
CREATE TABLE "PartnerApplication" (
    "id" TEXT NOT NULL,
    "storeName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "logoDocName" TEXT,
    "tradeType" TEXT NOT NULL,
    "tradeTypeLabel" TEXT NOT NULL,
    "locationName" TEXT,
    "address" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "areaLabel" TEXT NOT NULL,
    "waitlisted" BOOLEAN NOT NULL DEFAULT false,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "storeEmail" TEXT,
    "storePhone" TEXT,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "contactEmailVerifiedAt" TIMESTAMP(3),
    "soleProprietor" BOOLEAN NOT NULL DEFAULT false,
    "registrationNumber" TEXT,
    "registrationDocName" TEXT,
    "storefrontDocName" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'submitted',
    "rejectionReason" TEXT,
    "reviewerId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerEmailVerificationToken" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerEmailVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PartnerApplication_stage_idx" ON "PartnerApplication"("stage");

-- CreateIndex
CREATE INDEX "PartnerApplication_contactEmail_idx" ON "PartnerApplication"("contactEmail");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerEmailVerificationToken_tokenHash_key" ON "PartnerEmailVerificationToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PartnerEmailVerificationToken_applicationId_idx" ON "PartnerEmailVerificationToken"("applicationId");

-- AddForeignKey
ALTER TABLE "PartnerEmailVerificationToken" ADD CONSTRAINT "PartnerEmailVerificationToken_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "PartnerApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
