-- Customer: add passwordHash, make email required, make phone optional
ALTER TABLE "Customer" ADD COLUMN "passwordHash" TEXT NOT NULL;
ALTER TABLE "Customer" ALTER COLUMN "email" SET NOT NULL;
ALTER TABLE "Customer" ALTER COLUMN "phone" DROP NOT NULL;

-- Rider: add email + passwordHash, make phone optional
ALTER TABLE "Rider" ADD COLUMN "email" TEXT NOT NULL;
ALTER TABLE "Rider" ADD COLUMN "passwordHash" TEXT NOT NULL;
ALTER TABLE "Rider" ALTER COLUMN "phone" DROP NOT NULL;
CREATE UNIQUE INDEX "Rider_email_key" ON "Rider"("email");
