-- CreateTable
CREATE TABLE "AdminFxOverride" (
    "currencyCode" TEXT NOT NULL,
    "usdPerUnit" DECIMAL(36,18) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminFxOverride_pkey" PRIMARY KEY ("currencyCode")
);
