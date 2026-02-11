-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "verifiedBy" TEXT,
ADD COLUMN "verifiedAt" TIMESTAMP(3),
ADD COLUMN "rejectionReason" TEXT;
