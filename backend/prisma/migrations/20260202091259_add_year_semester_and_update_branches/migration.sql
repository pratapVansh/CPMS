-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "allowedYears" INTEGER[];

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "currentSemester" INTEGER,
ADD COLUMN     "currentYear" INTEGER;
