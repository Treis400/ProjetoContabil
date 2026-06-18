-- CreateEnum
CREATE TYPE "LalurPartBControlType" AS ENUM ('PREJUIZO_FISCAL', 'BASE_NEGATIVA_CSLL', 'AJUSTE_TEMPORARIO', 'INCENTIVO_FISCAL', 'DEPRECIACAO_ACELERADA', 'AMORTIZACAO_DIFERIDA', 'JCP_DIFERIDO', 'EQUIVALENCIA_PATRIMONIAL', 'PERDA_RECUPERAVEL');

-- CreateEnum
CREATE TYPE "LalurPartBMovType" AS ENUM ('INCLUSAO', 'UTILIZACAO', 'BAIXA', 'TRANSFERENCIA');

-- CreateEnum
CREATE TYPE "LalurAuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOCK', 'UNLOCK', 'IMPORT');

-- AlterTable
ALTER TABLE "LalurPartBBalance" ADD COLUMN     "controlType" "LalurPartBControlType" NOT NULL DEFAULT 'AJUSTE_TEMPORARIO',
ADD COLUMN     "originDate" TIMESTAMP(3),
ADD COLUMN     "originalValue" DECIMAL(14,2),
ADD COLUMN     "usedValue" DECIMAL(14,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "LalurPeriod" ADD COLUMN     "lockedAt" TIMESTAMP(3),
ADD COLUMN     "lockedByUserId" TEXT;

-- CreateTable
CREATE TABLE "LalurPartBMovement" (
    "id" TEXT NOT NULL,
    "partBBalanceId" TEXT NOT NULL,
    "type" "LalurPartBMovType" NOT NULL,
    "value" DECIMAL(14,2) NOT NULL,
    "description" TEXT NOT NULL,
    "documentRef" TEXT,
    "movementDate" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LalurPartBMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LalurCompensation" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "lalurPeriodId" TEXT NOT NULL,
    "originYear" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "originalValue" DECIMAL(14,2) NOT NULL,
    "availableValue" DECIMAL(14,2) NOT NULL,
    "usedValue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "remainingValue" DECIMAL(14,2) NOT NULL,
    "usedInYear" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LalurCompensation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LalurAccountingRule" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "accountCode" TEXT NOT NULL,
    "adjustTypeId" TEXT,
    "nature" "LalurAdjustNature" NOT NULL,
    "description" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LalurAccountingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LalurAccountingImport" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "lalurPeriodId" TEXT NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accountingProfit" DECIMAL(14,2) NOT NULL,
    "adjustmentsCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "importedByUserId" TEXT,

    CONSTRAINT "LalurAccountingImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LalurAuditLog" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "lalurPeriodId" TEXT,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "action" "LalurAuditAction" NOT NULL,
    "before" TEXT,
    "after" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LalurAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LalurPartBMovement_partBBalanceId_idx" ON "LalurPartBMovement"("partBBalanceId");

-- CreateIndex
CREATE INDEX "LalurCompensation_clientId_type_originYear_idx" ON "LalurCompensation"("clientId", "type", "originYear");

-- CreateIndex
CREATE UNIQUE INDEX "LalurAccountingRule_clientId_accountCode_key" ON "LalurAccountingRule"("clientId", "accountCode");

-- CreateIndex
CREATE INDEX "LalurAccountingImport_lalurPeriodId_idx" ON "LalurAccountingImport"("lalurPeriodId");

-- CreateIndex
CREATE INDEX "LalurAuditLog_clientId_lalurPeriodId_idx" ON "LalurAuditLog"("clientId", "lalurPeriodId");

-- AddForeignKey
ALTER TABLE "LalurPeriod" ADD CONSTRAINT "LalurPeriod_lockedByUserId_fkey" FOREIGN KEY ("lockedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LalurPartBMovement" ADD CONSTRAINT "LalurPartBMovement_partBBalanceId_fkey" FOREIGN KEY ("partBBalanceId") REFERENCES "LalurPartBBalance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LalurPartBMovement" ADD CONSTRAINT "LalurPartBMovement_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LalurCompensation" ADD CONSTRAINT "LalurCompensation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LalurCompensation" ADD CONSTRAINT "LalurCompensation_lalurPeriodId_fkey" FOREIGN KEY ("lalurPeriodId") REFERENCES "LalurPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LalurAccountingRule" ADD CONSTRAINT "LalurAccountingRule_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LalurAccountingRule" ADD CONSTRAINT "LalurAccountingRule_adjustTypeId_fkey" FOREIGN KEY ("adjustTypeId") REFERENCES "LalurAdjustType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LalurAccountingImport" ADD CONSTRAINT "LalurAccountingImport_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LalurAccountingImport" ADD CONSTRAINT "LalurAccountingImport_lalurPeriodId_fkey" FOREIGN KEY ("lalurPeriodId") REFERENCES "LalurPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LalurAccountingImport" ADD CONSTRAINT "LalurAccountingImport_importedByUserId_fkey" FOREIGN KEY ("importedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LalurAuditLog" ADD CONSTRAINT "LalurAuditLog_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LalurAuditLog" ADD CONSTRAINT "LalurAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
