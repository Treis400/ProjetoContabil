-- CreateEnum
CREATE TYPE "FiscalDocumentType" AS ENUM ('NF_E', 'NFC_E', 'CT_E', 'NFS_E', 'PRODUTOR', 'ENERGIA', 'TELECOM', 'COMBUSTIVEL', 'OUTRO');

-- CreateEnum
CREATE TYPE "FiscalDocumentStatus" AS ENUM ('REGULAR', 'CANCELADA', 'INUTILIZADA', 'DENEGADA');

-- CreateEnum
CREATE TYPE "FiscalEntryExit" AS ENUM ('ENTRADA', 'SAIDA');

-- CreateEnum
CREATE TYPE "FiscalDocumentOrigin" AS ENUM ('XML_IMPORTADO', 'DIGITACAO_MANUAL', 'IMPORTACAO_AUTOMATICA');

-- CreateEnum
CREATE TYPE "ValidationStatus" AS ENUM ('PENDENTE', 'VALIDO', 'DIVERGENTE', 'ERRO');

-- CreateTable
CREATE TABLE "FiscalDocument" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "documentType" "FiscalDocumentType" NOT NULL,
    "entryExit" "FiscalEntryExit" NOT NULL,
    "status" "FiscalDocumentStatus" NOT NULL DEFAULT 'REGULAR',
    "origin" "FiscalDocumentOrigin" NOT NULL DEFAULT 'DIGITACAO_MANUAL',
    "documentNumber" TEXT NOT NULL,
    "series" TEXT,
    "accessKey" TEXT,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "entryExitDate" TIMESTAMP(3),
    "cnpjIssuer" TEXT NOT NULL,
    "nameIssuer" TEXT NOT NULL,
    "stateRegIssuer" TEXT,
    "ufIssuer" TEXT,
    "cnpjRecipient" TEXT,
    "nameRecipient" TEXT,
    "stateRegRecipient" TEXT,
    "ufRecipient" TEXT,
    "totalProducts" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalDocument" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalFreight" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalInsurance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalDiscount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalOther" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "baseIcms" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "valueIcms" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "baseIcmsSt" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "valueIcmsSt" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "valueIpi" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "valuePis" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "valueCofins" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "baseIss" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "valueIss" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "valueIssRetained" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "valueInss" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "valueIrrf" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "valueCsll" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "xmlContent" TEXT,
    "validationStatus" "ValidationStatus" NOT NULL DEFAULT 'PENDENTE',
    "validationErrors" JSONB,
    "notes" TEXT,
    "periodMonth" INTEGER,
    "periodYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "FiscalDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalDocumentItem" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "itemNumber" INTEGER NOT NULL,
    "productCode" TEXT,
    "description" TEXT NOT NULL,
    "ncm" TEXT,
    "cfop" TEXT NOT NULL,
    "unitOfMeasure" TEXT,
    "quantity" DECIMAL(14,4) NOT NULL,
    "unitValue" DECIMAL(14,4) NOT NULL,
    "totalValue" DECIMAL(14,2) NOT NULL,
    "discount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "cstIcms" TEXT,
    "csosnIcms" TEXT,
    "cstIpi" TEXT,
    "cstPisCofins" TEXT,
    "baseIcms" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "icmsRate" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "valueIcms" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "baseIcmsSt" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "icmsStRate" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "valueIcmsSt" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "ipiRate" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "valueIpi" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "pisRate" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "valuePis" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "cofinsRate" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "valueCofins" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "allowsCredit" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FiscalDocumentItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FiscalDocument_accessKey_key" ON "FiscalDocument"("accessKey");

-- CreateIndex
CREATE INDEX "FiscalDocument_clientId_periodYear_periodMonth_idx" ON "FiscalDocument"("clientId", "periodYear", "periodMonth");

-- CreateIndex
CREATE INDEX "FiscalDocument_clientId_entryExit_idx" ON "FiscalDocument"("clientId", "entryExit");

-- CreateIndex
CREATE INDEX "FiscalDocument_accessKey_idx" ON "FiscalDocument"("accessKey");

-- CreateIndex
CREATE INDEX "FiscalDocumentItem_documentId_idx" ON "FiscalDocumentItem"("documentId");

-- AddForeignKey
ALTER TABLE "FiscalDocument" ADD CONSTRAINT "FiscalDocument_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalDocument" ADD CONSTRAINT "FiscalDocument_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalDocumentItem" ADD CONSTRAINT "FiscalDocumentItem_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "FiscalDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
