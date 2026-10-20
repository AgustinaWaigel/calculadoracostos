-- CreateTable
CREATE TABLE "PrintInk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'OTRO',
    "color" TEXT NOT NULL DEFAULT '#999999',
    "bottlePrice" DECIMAL NOT NULL,
    "yieldPages" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);
