-- CreateEnum
CREATE TYPE "PatrimonyAssetStatus" AS ENUM ('ATIVO', 'EM_MANUTENCAO', 'OCIOSO', 'ARRENDADO', 'CEDIDO', 'BAIXADO');

-- CreateEnum
CREATE TYPE "PatrimonyDeprecMethod" AS ENUM ('LINEAR', 'SOMA_DIGITOS', 'UNIDADES_PRODUZIDAS', 'HORAS_TRABALHADAS');

-- CreateEnum
CREATE TYPE "PatrimonyAcquisitionType" AS ENUM ('COMPRA', 'DOACAO', 'TRANSFERENCIA', 'CONSTRUCAO_PROPRIA');

-- CreateEnum
CREATE TYPE "PatrimonyMovementType" AS ENUM ('TRANSFERENCIA_LOCAL', 'TRANSFERENCIA_RESPONSAVEL', 'TRANSFERENCIA_EMPRESA', 'MUDANCA_STATUS');

-- CreateEnum
CREATE TYPE "PatrimonyDisposalType" AS ENUM ('VENDA', 'SUCATEAMENTO', 'PERDA_ROUBO', 'DOACAO', 'TRANSFERENCIA', 'OBSOLESCENCIA');

-- CreateEnum
CREATE TYPE "PatrimonyRevaluationType" AS ENUM ('REAVALIACAO', 'IMPAIRMENT', 'REVERSAO_IMPAIRMENT');

-- CreateEnum
CREATE TYPE "PatrimonyInventoryStatus" AS ENUM ('ABERTO', 'EM_ANDAMENTO', 'CONCLUIDO');

-- CreateEnum
CREATE TYPE "LalurAdjustNature" AS ENUM ('ADICAO', 'EXCLUSAO', 'COMPENSACAO');

-- CreateEnum
CREATE TYPE "LalurAdjustTiming" AS ENUM ('PERMANENTE', 'TEMPORARIA');

-- CreateEnum
CREATE TYPE "LalurPartBType" AS ENUM ('DEDUCAO_FUTURA', 'TRIBUTACAO_FUTURA');

-- CreateEnum
CREATE TYPE "IrpjCsllCalcStatus" AS ENUM ('RASCUNHO', 'CALCULADO', 'ENCERRADO');

-- CreateEnum
CREATE TYPE "EcfStatus" AS ENUM ('PENDENTE', 'GERADA', 'TRANSMITIDA', 'ERRO');

-- CreateEnum
CREATE TYPE "TaxRegimeCalc" AS ENUM ('LUCRO_REAL', 'LUCRO_PRESUMIDO');

-- CreateEnum
CREATE TYPE "PeriodClosingStatus" AS ENUM ('ABERTO', 'FECHADO');

-- CreateTable
CREATE TABLE "PeriodClosing" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "status" "PeriodClosingStatus" NOT NULL DEFAULT 'ABERTO',
    "closedAt" TIMESTAMP(3),
    "closedById" TEXT,
    "reopenedAt" TIMESTAMP(3),
    "reopenedById" TEXT,
    "reopenReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeriodClosing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LalurAdjustType" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "nature" "LalurAdjustNature" NOT NULL,
    "timing" "LalurAdjustTiming" NOT NULL DEFAULT 'PERMANENTE',
    "accountCode" TEXT,
    "ecfRefCode" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LalurAdjustType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LalurPeriod" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "taxRegime" "TaxRegimeCalc" NOT NULL DEFAULT 'LUCRO_REAL',
    "accountingProfit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalAdditions" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalExclusions" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalCompensations" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "realProfit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "status" "IrpjCsllCalcStatus" NOT NULL DEFAULT 'RASCUNHO',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LalurPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LalurPartAEntry" (
    "id" TEXT NOT NULL,
    "lalurPeriodId" TEXT NOT NULL,
    "adjustTypeId" TEXT,
    "sequence" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "nature" "LalurAdjustNature" NOT NULL,
    "timing" "LalurAdjustTiming" NOT NULL DEFAULT 'PERMANENTE',
    "value" DECIMAL(14,2) NOT NULL,
    "accountCode" TEXT,
    "documentRef" TEXT,
    "notes" TEXT,
    "periodMonth" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LalurPartAEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LalurPartBBalance" (
    "id" TEXT NOT NULL,
    "lalurPeriodId" TEXT NOT NULL,
    "partAEntryId" TEXT,
    "description" TEXT NOT NULL,
    "type" "LalurPartBType" NOT NULL,
    "openingBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "additions" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "realizations" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "closingBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LalurPartBBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IrpjCsllCalc" (
    "id" TEXT NOT NULL,
    "lalurPeriodId" TEXT NOT NULL,
    "taxRegime" "TaxRegimeCalc" NOT NULL DEFAULT 'LUCRO_REAL',
    "irpjBase" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "csllBase" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "irpjRate" DECIMAL(7,4) NOT NULL DEFAULT 15,
    "irpjValue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "irpjSurchargeBase" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "irpjSurchargeRate" DECIMAL(7,4) NOT NULL DEFAULT 10,
    "irpjSurchargeValue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "irpjTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "csllRate" DECIMAL(7,4) NOT NULL DEFAULT 9,
    "csllValue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "irpjIncentives" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "csllIncentives" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "irpjNet" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "csllNet" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "irpjMonthlyEstimate" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "csllMonthlyEstimate" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "status" "IrpjCsllCalcStatus" NOT NULL DEFAULT 'RASCUNHO',
    "calculatedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IrpjCsllCalc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EcfFile" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "status" "EcfStatus" NOT NULL DEFAULT 'PENDENTE',
    "fileContent" TEXT,
    "fileName" TEXT,
    "errorMessage" TEXT,
    "generatedAt" TIMESTAMP(3),
    "transmittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EcfFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatrimonyGroup" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "deprecMethod" "PatrimonyDeprecMethod" NOT NULL DEFAULT 'LINEAR',
    "usefulLifeYears" INTEGER NOT NULL DEFAULT 5,
    "annualRate" DECIMAL(7,4) NOT NULL DEFAULT 20,
    "residualValuePct" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "assetAccountCode" TEXT,
    "accumDeprecAccountCode" TEXT,
    "deprecExpenseAccountCode" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatrimonyGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatrimonyLocation" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "parentId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatrimonyLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatrimonyResponsible" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "sector" TEXT,
    "email" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatrimonyResponsible_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatrimonyAsset" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "tombamento" TEXT NOT NULL,
    "internalCode" TEXT,
    "description" TEXT NOT NULL,
    "serialNumber" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "manufacturer" TEXT,
    "barcode" TEXT,
    "groupId" TEXT,
    "locationId" TEXT,
    "responsibleId" TEXT,
    "costCenterCode" TEXT,
    "acquisitionType" "PatrimonyAcquisitionType" NOT NULL DEFAULT 'COMPRA',
    "acquisitionDate" TIMESTAMP(3) NOT NULL,
    "acquisitionValue" DECIMAL(14,2) NOT NULL,
    "residualValue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "usefulLifeMonths" INTEGER NOT NULL DEFAULT 60,
    "usefulLifeMonthsFiscal" INTEGER NOT NULL DEFAULT 60,
    "deprecMethod" "PatrimonyDeprecMethod" NOT NULL DEFAULT 'LINEAR',
    "deprecStartDate" TIMESTAMP(3),
    "deprecSuspended" BOOLEAN NOT NULL DEFAULT false,
    "documentOrigin" TEXT,
    "status" "PatrimonyAssetStatus" NOT NULL DEFAULT 'ATIVO',
    "assetAccountCode" TEXT,
    "accumDeprecAccountCode" TEXT,
    "deprecExpenseAccountCode" TEXT,
    "technicalNotes" TEXT,
    "oldTombamento" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatrimonyAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatrimonyDepreciation" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "openingValue" DECIMAL(14,2) NOT NULL,
    "accumDeprecOpen" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "monthlyDeprec" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "accumDeprecClose" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "closingValue" DECIMAL(14,2) NOT NULL,
    "fiscalDeprec" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "entryRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatrimonyDepreciation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatrimonyMovement" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "type" "PatrimonyMovementType" NOT NULL,
    "movementDate" TIMESTAMP(3) NOT NULL,
    "fromLocationId" TEXT,
    "toLocationId" TEXT,
    "fromResponsibleId" TEXT,
    "toResponsibleId" TEXT,
    "fromStatus" "PatrimonyAssetStatus",
    "toStatus" "PatrimonyAssetStatus",
    "reason" TEXT,
    "document" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatrimonyMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatrimonyRevaluation" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "type" "PatrimonyRevaluationType" NOT NULL DEFAULT 'REAVALIACAO',
    "revaluationDate" TIMESTAMP(3) NOT NULL,
    "previousValue" DECIMAL(14,2) NOT NULL,
    "newValue" DECIMAL(14,2) NOT NULL,
    "adjustment" DECIMAL(14,2) NOT NULL,
    "expertReport" TEXT,
    "accountCode" TEXT,
    "entryRef" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatrimonyRevaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatrimonyDisposal" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "type" "PatrimonyDisposalType" NOT NULL DEFAULT 'SUCATEAMENTO',
    "disposalDate" TIMESTAMP(3) NOT NULL,
    "bookValue" DECIMAL(14,2) NOT NULL,
    "saleValue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "gainLoss" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "finalDeprec" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "documentRef" TEXT,
    "entryRef" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatrimonyDisposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatrimonyInventory" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "PatrimonyInventoryStatus" NOT NULL DEFAULT 'ABERTO',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatrimonyInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatrimonyInventoryItem" (
    "id" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "found" BOOLEAN,
    "foundLocation" TEXT,
    "foundCondition" TEXT,
    "notes" TEXT,
    "checkedAt" TIMESTAMP(3),

    CONSTRAINT "PatrimonyInventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PeriodClosing_clientId_periodYear_idx" ON "PeriodClosing"("clientId", "periodYear");

-- CreateIndex
CREATE UNIQUE INDEX "PeriodClosing_clientId_periodYear_periodMonth_key" ON "PeriodClosing"("clientId", "periodYear", "periodMonth");

-- CreateIndex
CREATE UNIQUE INDEX "LalurAdjustType_clientId_code_key" ON "LalurAdjustType"("clientId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "LalurPeriod_clientId_periodYear_key" ON "LalurPeriod"("clientId", "periodYear");

-- CreateIndex
CREATE INDEX "LalurPartAEntry_lalurPeriodId_idx" ON "LalurPartAEntry"("lalurPeriodId");

-- CreateIndex
CREATE INDEX "LalurPartBBalance_lalurPeriodId_idx" ON "LalurPartBBalance"("lalurPeriodId");

-- CreateIndex
CREATE UNIQUE INDEX "IrpjCsllCalc_lalurPeriodId_key" ON "IrpjCsllCalc"("lalurPeriodId");

-- CreateIndex
CREATE UNIQUE INDEX "EcfFile_clientId_periodYear_key" ON "EcfFile"("clientId", "periodYear");

-- CreateIndex
CREATE UNIQUE INDEX "PatrimonyGroup_clientId_code_key" ON "PatrimonyGroup"("clientId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "PatrimonyLocation_clientId_code_key" ON "PatrimonyLocation"("clientId", "code");

-- CreateIndex
CREATE INDEX "PatrimonyAsset_clientId_groupId_idx" ON "PatrimonyAsset"("clientId", "groupId");

-- CreateIndex
CREATE INDEX "PatrimonyAsset_clientId_status_idx" ON "PatrimonyAsset"("clientId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PatrimonyAsset_clientId_tombamento_key" ON "PatrimonyAsset"("clientId", "tombamento");

-- CreateIndex
CREATE INDEX "PatrimonyDepreciation_assetId_idx" ON "PatrimonyDepreciation"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "PatrimonyDepreciation_assetId_periodYear_periodMonth_key" ON "PatrimonyDepreciation"("assetId", "periodYear", "periodMonth");

-- CreateIndex
CREATE INDEX "PatrimonyMovement_assetId_idx" ON "PatrimonyMovement"("assetId");

-- CreateIndex
CREATE INDEX "PatrimonyRevaluation_assetId_idx" ON "PatrimonyRevaluation"("assetId");

-- CreateIndex
CREATE INDEX "PatrimonyInventory_clientId_idx" ON "PatrimonyInventory"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "PatrimonyInventoryItem_inventoryId_assetId_key" ON "PatrimonyInventoryItem"("inventoryId", "assetId");

-- AddForeignKey
ALTER TABLE "PeriodClosing" ADD CONSTRAINT "PeriodClosing_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LalurAdjustType" ADD CONSTRAINT "LalurAdjustType_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LalurPeriod" ADD CONSTRAINT "LalurPeriod_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LalurPartAEntry" ADD CONSTRAINT "LalurPartAEntry_lalurPeriodId_fkey" FOREIGN KEY ("lalurPeriodId") REFERENCES "LalurPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LalurPartAEntry" ADD CONSTRAINT "LalurPartAEntry_adjustTypeId_fkey" FOREIGN KEY ("adjustTypeId") REFERENCES "LalurAdjustType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LalurPartBBalance" ADD CONSTRAINT "LalurPartBBalance_lalurPeriodId_fkey" FOREIGN KEY ("lalurPeriodId") REFERENCES "LalurPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LalurPartBBalance" ADD CONSTRAINT "LalurPartBBalance_partAEntryId_fkey" FOREIGN KEY ("partAEntryId") REFERENCES "LalurPartAEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IrpjCsllCalc" ADD CONSTRAINT "IrpjCsllCalc_lalurPeriodId_fkey" FOREIGN KEY ("lalurPeriodId") REFERENCES "LalurPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcfFile" ADD CONSTRAINT "EcfFile_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatrimonyGroup" ADD CONSTRAINT "PatrimonyGroup_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatrimonyGroup" ADD CONSTRAINT "PatrimonyGroup_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "PatrimonyGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatrimonyLocation" ADD CONSTRAINT "PatrimonyLocation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatrimonyLocation" ADD CONSTRAINT "PatrimonyLocation_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "PatrimonyLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatrimonyResponsible" ADD CONSTRAINT "PatrimonyResponsible_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatrimonyAsset" ADD CONSTRAINT "PatrimonyAsset_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatrimonyAsset" ADD CONSTRAINT "PatrimonyAsset_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "PatrimonyGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatrimonyAsset" ADD CONSTRAINT "PatrimonyAsset_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "PatrimonyLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatrimonyAsset" ADD CONSTRAINT "PatrimonyAsset_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "PatrimonyResponsible"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatrimonyDepreciation" ADD CONSTRAINT "PatrimonyDepreciation_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "PatrimonyAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatrimonyMovement" ADD CONSTRAINT "PatrimonyMovement_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "PatrimonyAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatrimonyRevaluation" ADD CONSTRAINT "PatrimonyRevaluation_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "PatrimonyAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatrimonyDisposal" ADD CONSTRAINT "PatrimonyDisposal_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "PatrimonyAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatrimonyInventory" ADD CONSTRAINT "PatrimonyInventory_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatrimonyInventoryItem" ADD CONSTRAINT "PatrimonyInventoryItem_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "PatrimonyInventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatrimonyInventoryItem" ADD CONSTRAINT "PatrimonyInventoryItem_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "PatrimonyAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
