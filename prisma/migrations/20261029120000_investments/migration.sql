-- CreateEnum
CREATE TYPE "InvestmentKind" AS ENUM ('INVESTMENT', 'RECOVERY');

-- CreateTable
CREATE TABLE "InvestmentMovement" (
    "id" TEXT NOT NULL,
    "kind" "InvestmentKind" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestmentMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InvestmentMovement_date_idx" ON "InvestmentMovement"("date");

-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "acceptedAt" TIMESTAMP(3);

-- Los que ya estaban aceptados: la mejor fecha que tenemos es la última modificación.
UPDATE "Quote" SET "acceptedAt" = "updatedAt" WHERE "status" = 'ACCEPTED';
