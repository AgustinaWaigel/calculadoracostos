-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "instagram" TEXT,
    "address" TEXT,
    "taxCondition" TEXT NOT NULL DEFAULT 'MONOTRIBUTO',
    "ivaPercent" DECIMAL NOT NULL DEFAULT 21,
    "monthlyUnitsEstimate" INTEGER NOT NULL DEFAULT 100,
    "defaultMarginPercent" DECIMAL NOT NULL DEFAULT 40,
    "pricingMode" TEXT NOT NULL DEFAULT 'MARGIN',
    "roundTo" DECIMAL NOT NULL DEFAULT 10,
    "quoteValidityDays" INTEGER NOT NULL DEFAULT 7,
    "quoteNumberSeq" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Supply" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'MATERIAL',
    "category" TEXT,
    "purchaseUnit" TEXT NOT NULL,
    "usageUnit" TEXT NOT NULL DEFAULT 'unidad',
    "packQuantity" DECIMAL NOT NULL,
    "packPrice" DECIMAL NOT NULL,
    "supplier" TEXT,
    "url" TEXT,
    "meliItemId" TEXT,
    "priceUpdatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SupplyPriceHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplyId" TEXT NOT NULL,
    "packPrice" DECIMAL NOT NULL,
    "packQuantity" DECIMAL NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "usdRate" DECIMAL,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupplyPriceHistory_supplyId_fkey" FOREIGN KEY ("supplyId") REFERENCES "Supply" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LaborProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "hourlyRate" DECIMAL NOT NULL,
    "color" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MarketRate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "hourlyRate" DECIMAL NOT NULL,
    "source" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "FixedCost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'OTROS',
    "monthlyAmount" DECIMAL NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Machine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "price" DECIMAL NOT NULL,
    "usefulLife" DECIMAL NOT NULL,
    "lifeUnit" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "batchYield" DECIMAL NOT NULL DEFAULT 1,
    "wastePercent" DECIMAL NOT NULL DEFAULT 0,
    "includeFixedCosts" BOOLEAN NOT NULL DEFAULT true,
    "marginPercent" DECIMAL,
    "pricingMode" TEXT,
    "duplicatedFromId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProductSupply" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "supplyId" TEXT NOT NULL,
    "quantity" DECIMAL NOT NULL,
    CONSTRAINT "ProductSupply_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductSupply_supplyId_fkey" FOREIGN KEY ("supplyId") REFERENCES "Supply" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductLabor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "minutes" DECIMAL NOT NULL,
    CONSTRAINT "ProductLabor_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductLabor_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "LaborProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductMachine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "usage" DECIMAL NOT NULL,
    CONSTRAINT "ProductMachine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductMachine_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SalesChannel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'OTHER',
    "commissionPercent" DECIMAL NOT NULL DEFAULT 0,
    "fixedFee" DECIMAL NOT NULL DEFAULT 0,
    "shippingCost" DECIMAL NOT NULL DEFAULT 0,
    "paymentFeePercent" DECIMAL NOT NULL DEFAULT 0,
    "installmentsPercent" DECIMAL NOT NULL DEFAULT 0,
    "priceAdjustPercent" DECIMAL NOT NULL DEFAULT 0,
    "applyIva" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "VolumeTier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "minQuantity" INTEGER NOT NULL,
    "discountPercent" DECIMAL NOT NULL
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" INTEGER NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientPhone" TEXT,
    "clientEmail" TEXT,
    "notes" TEXT,
    "validUntil" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "discountPercent" DECIMAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "QuoteItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteId" TEXT NOT NULL,
    "productId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL NOT NULL,
    "unitPrice" DECIMAL NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "QuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuoteItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MeliToken" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "meliUserId" TEXT NOT NULL,
    "nickname" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MeliCache" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "payload" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MeliOAuthState" (
    "state" TEXT NOT NULL PRIMARY KEY,
    "verifier" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
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
