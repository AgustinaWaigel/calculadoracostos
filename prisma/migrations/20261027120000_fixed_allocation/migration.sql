-- CreateEnum
CREATE TYPE "FixedAllocation" AS ENUM ('SIZE', 'TIME');

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "fixedAllocation" "FixedAllocation" NOT NULL DEFAULT 'SIZE',
ADD COLUMN     "monthlyHoursEstimate" INTEGER NOT NULL DEFAULT 80;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "fixedWeight" DECIMAL(65,30) NOT NULL DEFAULT 1;
