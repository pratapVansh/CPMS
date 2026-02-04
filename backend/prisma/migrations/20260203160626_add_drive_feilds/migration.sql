-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "ctc" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "driveDate" TIMESTAMP(3),
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "jobDescription" TEXT,
ADD COLUMN     "jobType" TEXT DEFAULT 'Full-time',
ADD COLUMN     "location" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "maxBacklogs" INTEGER,
ADD COLUMN     "requiredDocuments" TEXT,
ADD COLUMN     "selectionRounds" TEXT,
ADD COLUMN     "specialInstructions" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'upcoming',
ADD COLUMN     "website" TEXT,
ALTER COLUMN "minCgpa" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Company_status_idx" ON "Company"("status");

-- CreateIndex
CREATE INDEX "Company_driveDate_idx" ON "Company"("driveDate");
