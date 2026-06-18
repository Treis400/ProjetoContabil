-- CreateEnum
CREATE TYPE "ObligationType" AS ENUM ('SPED_FISCAL', 'SPED_CONTRIBUICOES', 'REINF', 'DCTF', 'PGDAS', 'DAS', 'DIRF', 'NFSE_MUNICIPAL', 'OUTRA');

-- CreateEnum
CREATE TYPE "ObligationStatus" AS ENUM ('PENDENTE', 'GERADA', 'TRANSMITIDA', 'ERRO', 'DISPENSADA');

-- CreateEnum
CREATE TYPE "BookType" AS ENUM ('ENTRADAS', 'SAIDAS', 'APURACAO_ICMS', 'APURACAO_IPI', 'APURACAO_PIS_COFINS', 'APURACAO_ISS');

-- CreateTable
CREATE TABLE "FiscalObligation" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" "ObligationType" NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" "ObligationStatus" NOT NULL DEFAULT 'PENDENTE',
    "notes" TEXT,
    "fileContent" TEXT,
    "fileName" TEXT,
    "errorMessage" TEXT,
    "generatedAt" TIMESTAMP(3),
    "transmittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "FiscalObligation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalBook" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "bookType" "BookType" NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalEntries" INTEGER NOT NULL DEFAULT 0,
    "totalSaidas" INTEGER NOT NULL DEFAULT 0,
    "totalValueEntries" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalValueSaidas" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalIcms" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalIpi" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalPis" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalCofins" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalIss" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "fileContent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "FiscalBook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FiscalObligation_clientId_periodYear_periodMonth_idx" ON "FiscalObligation"("clientId", "periodYear", "periodMonth");

-- CreateIndex
CREATE UNIQUE INDEX "FiscalObligation_clientId_type_periodMonth_periodYear_key" ON "FiscalObligation"("clientId", "type", "periodMonth", "periodYear");

-- CreateIndex
CREATE INDEX "FiscalBook_clientId_periodYear_periodMonth_idx" ON "FiscalBook"("clientId", "periodYear", "periodMonth");

-- AddForeignKey
ALTER TABLE "FiscalObligation" ADD CONSTRAINT "FiscalObligation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalObligation" ADD CONSTRAINT "FiscalObligation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalBook" ADD CONSTRAINT "FiscalBook_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalBook" ADD CONSTRAINT "FiscalBook_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
