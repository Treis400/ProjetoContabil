-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('SINTETICA', 'ANALITICA');

-- CreateEnum
CREATE TYPE "AccountNature" AS ENUM ('DEVEDORA', 'CREDORA');

-- CreateEnum
CREATE TYPE "AccountClass" AS ENUM ('ATIVO', 'PASSIVO', 'PATRIMONIO_LIQUIDO', 'RECEITA', 'DESPESA', 'CUSTO', 'RESULTADO');

-- CreateEnum
CREATE TYPE "CostCenterType" AS ENUM ('ADMINISTRATIVO', 'OPERACIONAL', 'PROJETO', 'UNIDADE');

-- CreateEnum
CREATE TYPE "EntryTypeClass" AS ENUM ('NORMAL', 'PROVISAO', 'RECLASSIFICACAO', 'ENCERRAMENTO', 'AJUSTE');

-- CreateEnum
CREATE TYPE "ClosingMethod" AS ENUM ('AUTOMATICO', 'MANUAL');

-- CreateTable
CREATE TABLE "AccountingPlan" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL DEFAULT 'ANALITICA',
    "nature" "AccountNature" NOT NULL,
    "classification" "AccountClass" NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "parentId" TEXT,
    "allowsEntry" BOOLEAN NOT NULL DEFAULT true,
    "usesCostCenter" BOOLEAN NOT NULL DEFAULT false,
    "usesStdHistory" BOOLEAN NOT NULL DEFAULT false,
    "integratesModules" BOOLEAN NOT NULL DEFAULT false,
    "spedRefCode" TEXT,
    "ecfRefCode" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostCenter" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CostCenterType" NOT NULL DEFAULT 'OPERACIONAL',
    "level" INTEGER NOT NULL DEFAULT 1,
    "parentId" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CostCenter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StandardHistory" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "complement" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StandardHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntryType" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "classification" "EntryTypeClass" NOT NULL DEFAULT 'NORMAL',
    "appearsInReports" BOOLEAN NOT NULL DEFAULT true,
    "allowsReversal" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntryType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingParameters" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "closingMethod" "ClosingMethod" NOT NULL DEFAULT 'AUTOMATICO',
    "costCenterRequired" BOOLEAN NOT NULL DEFAULT false,
    "integrateFiscal" BOOLEAN NOT NULL DEFAULT true,
    "integratePayroll" BOOLEAN NOT NULL DEFAULT false,
    "integrateFinancial" BOOLEAN NOT NULL DEFAULT false,
    "integratePatrimony" BOOLEAN NOT NULL DEFAULT false,
    "integrateBilling" BOOLEAN NOT NULL DEFAULT false,
    "closedPeriods" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "currentYear" INTEGER,
    "resultAccountId" TEXT,
    "retainedEarningsAccId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingParameters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountingPlan_clientId_level_idx" ON "AccountingPlan"("clientId", "level");

-- CreateIndex
CREATE INDEX "AccountingPlan_clientId_classification_idx" ON "AccountingPlan"("clientId", "classification");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingPlan_clientId_code_key" ON "AccountingPlan"("clientId", "code");

-- CreateIndex
CREATE INDEX "CostCenter_clientId_level_idx" ON "CostCenter"("clientId", "level");

-- CreateIndex
CREATE UNIQUE INDEX "CostCenter_clientId_code_key" ON "CostCenter"("clientId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "StandardHistory_clientId_code_key" ON "StandardHistory"("clientId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "EntryType_clientId_code_key" ON "EntryType"("clientId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingParameters_clientId_key" ON "AccountingParameters"("clientId");

-- AddForeignKey
ALTER TABLE "AccountingPlan" ADD CONSTRAINT "AccountingPlan_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingPlan" ADD CONSTRAINT "AccountingPlan_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "AccountingPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostCenter" ADD CONSTRAINT "CostCenter_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostCenter" ADD CONSTRAINT "CostCenter_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CostCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandardHistory" ADD CONSTRAINT "StandardHistory_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryType" ADD CONSTRAINT "EntryType_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingParameters" ADD CONSTRAINT "AccountingParameters_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
