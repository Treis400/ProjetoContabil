-- CreateEnum
CREATE TYPE "EntryStatus" AS ENUM ('RASCUNHO', 'CONFIRMADO', 'ESTORNADO');

-- CreateEnum
CREATE TYPE "EntrySource" AS ENUM ('MANUAL', 'FISCAL', 'FOLHA', 'FINANCEIRO', 'ESTORNO');

-- CreateEnum
CREATE TYPE "DebitCredit" AS ENUM ('DEBITO', 'CREDITO');

-- CreateTable
CREATE TABLE "AccountingEntry" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "entryNumber" INTEGER NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "entryTypeId" TEXT,
    "status" "EntryStatus" NOT NULL DEFAULT 'RASCUNHO',
    "source" "EntrySource" NOT NULL DEFAULT 'MANUAL',
    "reversedById" TEXT,
    "reversalOfId" TEXT,
    "documentRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "AccountingEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingEntryLine" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "accountId" TEXT NOT NULL,
    "costCenterId" TEXT,
    "historyId" TEXT,
    "complement" TEXT,
    "debitCredit" "DebitCredit" NOT NULL,
    "value" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "AccountingEntryLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountingEntry_clientId_periodYear_periodMonth_idx" ON "AccountingEntry"("clientId", "periodYear", "periodMonth");

-- CreateIndex
CREATE INDEX "AccountingEntry_clientId_entryDate_idx" ON "AccountingEntry"("clientId", "entryDate");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingEntry_clientId_entryNumber_key" ON "AccountingEntry"("clientId", "entryNumber");

-- CreateIndex
CREATE INDEX "AccountingEntryLine_entryId_idx" ON "AccountingEntryLine"("entryId");

-- CreateIndex
CREATE INDEX "AccountingEntryLine_accountId_idx" ON "AccountingEntryLine"("accountId");

-- AddForeignKey
ALTER TABLE "AccountingEntry" ADD CONSTRAINT "AccountingEntry_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingEntry" ADD CONSTRAINT "AccountingEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingEntry" ADD CONSTRAINT "AccountingEntry_reversedById_fkey" FOREIGN KEY ("reversedById") REFERENCES "AccountingEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingEntryLine" ADD CONSTRAINT "AccountingEntryLine_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "AccountingEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
