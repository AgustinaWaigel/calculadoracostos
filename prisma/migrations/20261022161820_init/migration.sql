-- CreateEnum
CREATE TYPE "TaxCondition" AS ENUM ('MONOTRIBUTO', 'RESPONSABLE_INSCRIPTO', 'EXENTO');

-- CreateEnum
CREATE TYPE "PricingMode" AS ENUM ('MARGIN', 'MARKUP');

-- CreateEnum
CREATE TYPE "SupplyKind" AS ENUM ('MATERIAL', 'SERVICE');

-- CreateEnum
CREATE TYPE "PriceSource" AS ENUM ('MANUAL', 'MELI_SEARCH', 'MELI_LINK', 'MELI_REFRESH', 'IMPORT');

-- CreateEnum
CREATE TYPE "FixedCostCategory" AS ENUM ('ALQUILER', 'SERVICIOS', 'INTERNET', 'IMPUESTOS', 'SUSCRIPCIONES', 'OTROS');

-- CreateEnum
CREATE TYPE "LifeUnit" AS ENUM ('UNITS', 'HOURS');

-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('DIRECT', 'MELI_CLASSIC', 'MELI_PREMIUM', 'WHOLESALE', 'OTHER');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "instagram" TEXT,
    "address" TEXT,
    "taxCondition" "TaxCondition" NOT NULL DEFAULT 'MONOTRIBUTO',
    "ivaPercent" DECIMAL(65,30) NOT NULL DEFAULT 21,
    "monthlyUnitsEstimate" INTEGER NOT NULL DEFAULT 100,
    "defaultMarginPercent" DECIMAL(65,30) NOT NULL DEFAULT 40,
    "pricingMode" "PricingMode" NOT NULL DEFAULT 'MARGIN',
    "roundTo" DECIMAL(65,30) NOT NULL DEFAULT 10,
    "quoteValidityDays" INTEGER NOT NULL DEFAULT 7,
    "quoteNumberSeq" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supply" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "SupplyKind" NOT NULL DEFAULT 'MATERIAL',
    "category" TEXT,
    "purchaseUnit" TEXT NOT NULL,
    "usageUnit" TEXT NOT NULL DEFAULT 'unidad',
    "packQuantity" DECIMAL(65,30) NOT NULL,
    "packPrice" DECIMAL(65,30) NOT NULL,
    "supplier" TEXT,
    "url" TEXT,
    "meliItemId" TEXT,
    "priceUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplyPriceHistory" (
    "id" TEXT NOT NULL,
    "supplyId" TEXT NOT NULL,
    "packPrice" DECIMAL(65,30) NOT NULL,
    "packQuantity" DECIMAL(65,30) NOT NULL,
    "source" "PriceSource" NOT NULL DEFAULT 'MANUAL',
    "usdRate" DECIMAL(65,30),
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplyPriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LaborProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hourlyRate" DECIMAL(65,30) NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LaborProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketRate" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "hourlyRate" DECIMAL(65,30) NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FixedCost" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "FixedCostCategory" NOT NULL DEFAULT 'OTROS',
    "monthlyAmount" DECIMAL(65,30) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FixedCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Machine" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "usefulLife" DECIMAL(65,30) NOT NULL,
    "lifeUnit" "LifeUnit" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Machine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "batchYield" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "wastePercent" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "includeFixedCosts" BOOLEAN NOT NULL DEFAULT true,
    "marginPercent" DECIMAL(65,30),
    "pricingMode" "PricingMode",
    "duplicatedFromId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSupply" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "supplyId" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "ProductSupply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductLabor" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "minutes" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "ProductLabor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductMachine" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "usage" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "ProductMachine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesChannel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ChannelType" NOT NULL DEFAULT 'OTHER',
    "commissionPercent" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "fixedFee" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "shippingCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "paymentFeePercent" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "installmentsPercent" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "priceAdjustPercent" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "applyIva" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SalesChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolumeTier" (
    "id" TEXT NOT NULL,
    "minQuantity" INTEGER NOT NULL,
    "discountPercent" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "VolumeTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientPhone" TEXT,
    "clientEmail" TEXT,
    "notes" TEXT,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "discountPercent" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteItem" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "productId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "QuoteItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeliToken" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "meliUserId" TEXT NOT NULL,
    "nickname" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeliToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeliCache" (
    "key" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeliCache_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "MeliOAuthState" (
    "state" TEXT NOT NULL,
    "verifier" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeliOAuthState_pkey" PRIMARY KEY ("state")
);

-- CreateTable
CREATE TABLE "PrintInk" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'OTRO',
    "color" TEXT NOT NULL DEFAULT '#999999',
    "bottlePrice" DECIMAL(65,30) NOT NULL,
    "yieldPages" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrintInk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeliAppConfig" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT NOT NULL,
    "redirectUri" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeliAppConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Supply_category_idx" ON "Supply"("category");

-- CreateIndex
CREATE INDEX "SupplyPriceHistory_supplyId_recordedAt_idx" ON "SupplyPriceHistory"("supplyId", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSupply_productId_supplyId_key" ON "ProductSupply"("productId", "supplyId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductLabor_productId_profileId_key" ON "ProductLabor"("productId", "profileId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductMachine_productId_machineId_key" ON "ProductMachine"("productId", "machineId");

-- CreateIndex
CREATE UNIQUE INDEX "VolumeTier_minQuantity_key" ON "VolumeTier"("minQuantity");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_number_key" ON "Quote"("number");

-- CreateIndex
CREATE INDEX "MeliCache_expiresAt_idx" ON "MeliCache"("expiresAt");

-- AddForeignKey
ALTER TABLE "SupplyPriceHistory" ADD CONSTRAINT "SupplyPriceHistory_supplyId_fkey" FOREIGN KEY ("supplyId") REFERENCES "Supply"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSupply" ADD CONSTRAINT "ProductSupply_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSupply" ADD CONSTRAINT "ProductSupply_supplyId_fkey" FOREIGN KEY ("supplyId") REFERENCES "Supply"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductLabor" ADD CONSTRAINT "ProductLabor_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductLabor" ADD CONSTRAINT "ProductLabor_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "LaborProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMachine" ADD CONSTRAINT "ProductMachine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMachine" ADD CONSTRAINT "ProductMachine_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
