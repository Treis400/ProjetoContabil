-- CreateEnum
CREATE TYPE "TaxApurationType" AS ENUM ('ICMS', 'IPI', 'PIS_COFINS', 'ISS', 'SIMPLES_NACIONAL');

-- CreateEnum
CREATE TYPE "ApurationStatus" AS ENUM ('ABERTA', 'CALCULADA', 'ENCERRADA');

-- CreateEnum
CREATE TYPE "AdjustmentType" AS ENUM ('ESTORNO_CREDITO', 'ESTORNO_DEBITO', 'OUTROS_CREDITOS', 'OUTROS_DEBITOS', 'INCENTIVO_FISCAL', 'DEDUCAO');

-- CreateTable
CREATE TABLE "TaxApuration" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "taxType" "TaxApurationType" NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "status" "ApurationStatus" NOT NULL DEFAULT 'ABERTA',
    "notes" TEXT,
    "calculatedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "TaxApuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxApurationAdjustment" (
    "id" TEXT NOT NULL,
    "apurationId" TEXT NOT NULL,
    "type" "AdjustmentType" NOT NULL,
    "description" TEXT NOT NULL,
    "value" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxApurationAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxApurationResult" (
    "id" TEXT NOT NULL,
    "apurationId" TEXT NOT NULL,
    "totalDebits" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalCredits" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalStDebits" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalStCredits" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalDifal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalPartilha" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalAdjustments" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "previousBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "balance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxDue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "nextBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "pisRevenue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "pisDebits" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "pisCredits" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "pisNet" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "cofinsRevenue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "cofinsDebits" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "cofinsCredits" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "cofinsNet" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "issOwn" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "issRetained" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "issSubstitute" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "issNet" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "simplesRbcTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "simplesRbcAcum" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "simplesAliquota" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "simplesTotalDue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxApurationResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxApurationSimplesRevenue" (
    "id" TEXT NOT NULL,
    "apurationId" TEXT NOT NULL,
    "annex" TEXT NOT NULL,
    "totalRevenue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "revenueWithSt" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "revenueMonophasic" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "revenueIssRetained" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "netRevenue" DECIMAL(14,2) NOT NULL DEFAULT 0,

    CONSTRAINT "TaxApurationSimplesRevenue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaxApuration_clientId_periodYear_periodMonth_idx" ON "TaxApuration"("clientId", "periodYear", "periodMonth");

-- CreateIndex
CREATE UNIQUE INDEX "TaxApuration_clientId_taxType_periodMonth_periodYear_key" ON "TaxApuration"("clientId", "taxType", "periodMonth", "periodYear");

-- CreateIndex
CREATE UNIQUE INDEX "TaxApurationResult_apurationId_key" ON "TaxApurationResult"("apurationId");

-- CreateIndex
CREATE UNIQUE INDEX "TaxApurationSimplesRevenue_apurationId_annex_key" ON "TaxApurationSimplesRevenue"("apurationId", "annex");

-- AddForeignKey
ALTER TABLE "TaxApuration" ADD CONSTRAINT "TaxApuration_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxApuration" ADD CONSTRAINT "TaxApuration_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxApurationAdjustment" ADD CONSTRAINT "TaxApurationAdjustment_apurationId_fkey" FOREIGN KEY ("apurationId") REFERENCES "TaxApuration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxApurationResult" ADD CONSTRAINT "TaxApurationResult_apurationId_fkey" FOREIGN KEY ("apurationId") REFERENCES "TaxApuration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxApurationSimplesRevenue" ADD CONSTRAINT "TaxApurationSimplesRevenue_apurationId_fkey" FOREIGN KEY ("apurationId") REFERENCES "TaxApuration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
