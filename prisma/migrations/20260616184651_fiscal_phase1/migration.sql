-- CreateEnum
CREATE TYPE "IcmsApurationType" AS ENUM ('MENSAL', 'ESPECIAL');

-- CreateEnum
CREATE TYPE "PisCofinsRegime" AS ENUM ('CUMULATIVO', 'NAO_CUMULATIVO', 'MISTO');

-- CreateEnum
CREATE TYPE "SpedPeriod" AS ENUM ('MENSAL', 'ANUAL');

-- CreateEnum
CREATE TYPE "CertificateType" AS ENUM ('A1', 'A3');

-- CreateEnum
CREATE TYPE "IssIncidenceMunicipality" AS ENUM ('PRESTADOR', 'TOMADOR');

-- CreateEnum
CREATE TYPE "CfopOperationType" AS ENUM ('ENTRADA', 'SAIDA');

-- CreateEnum
CREATE TYPE "CstTaxType" AS ENUM ('ICMS', 'IPI', 'PIS_COFINS', 'CSOSN');

-- CreateEnum
CREATE TYPE "CstEntryExit" AS ENUM ('ENTRADA', 'SAIDA', 'AMBOS');

-- AlterTable
ALTER TABLE "ClientTaxProfile" ADD COLUMN     "certificateResponsible" TEXT,
ADD COLUMN     "certificateType" "CertificateType",
ADD COLUMN     "icmsApurationType" "IcmsApurationType",
ADD COLUMN     "icmsHasDifal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "icmsHasPartilha" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "icmsHasSt" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ipiContributor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "issHasRetention" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "issMainMunicipality" TEXT,
ADD COLUMN     "pisCofinsRegime" "PisCofinsRegime",
ADD COLUMN     "spedContribPeriod" "SpedPeriod",
ADD COLUMN     "spedFiscalPeriod" "SpedPeriod";

-- CreateTable
CREATE TABLE "FiscalProduct" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "internalCode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unitOfMeasure" TEXT NOT NULL,
    "barcode" TEXT,
    "ncm" TEXT NOT NULL,
    "cest" TEXT,
    "group" TEXT,
    "subgroup" TEXT,
    "cfopInbound" TEXT,
    "cfopOutbound" TEXT,
    "cstIcms" TEXT,
    "csosnIcms" TEXT,
    "cstIpi" TEXT,
    "cstPisCofins" TEXT,
    "icmsInternalRate" DECIMAL(7,4),
    "icmsInterstateRate" DECIMAL(7,4),
    "icmsStRate" DECIMAL(7,4),
    "ipiRate" DECIMAL(7,4),
    "pisRate" DECIMAL(7,4),
    "cofinsRate" DECIMAL(7,4),
    "generatesPisCofinsCredit" BOOLEAN NOT NULL DEFAULT false,
    "isMonophasic" BOOLEAN NOT NULL DEFAULT false,
    "isSubjectToSt" BOOLEAN NOT NULL DEFAULT false,
    "generatesDifal" BOOLEAN NOT NULL DEFAULT false,
    "isImported" BOOLEAN NOT NULL DEFAULT false,
    "isFuel" BOOLEAN NOT NULL DEFAULT false,
    "isEnergy" BOOLEAN NOT NULL DEFAULT false,
    "isCommunication" BOOLEAN NOT NULL DEFAULT false,
    "isTransport" BOOLEAN NOT NULL DEFAULT false,
    "isForConsumption" BOOLEAN NOT NULL DEFAULT false,
    "isForResale" BOOLEAN NOT NULL DEFAULT false,
    "isFixedAsset" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FiscalProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalService" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "internalCode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "municipalCode" TEXT,
    "lc116Code" TEXT,
    "issRate" DECIMAL(7,4),
    "issOwnRule" BOOLEAN NOT NULL DEFAULT false,
    "issRetainedRule" BOOLEAN NOT NULL DEFAULT false,
    "issSubstituteRule" BOOLEAN NOT NULL DEFAULT false,
    "hasInssRetention" BOOLEAN NOT NULL DEFAULT false,
    "hasIrrfRetention" BOOLEAN NOT NULL DEFAULT false,
    "hasCsllRetention" BOOLEAN NOT NULL DEFAULT false,
    "hasPisRetention" BOOLEAN NOT NULL DEFAULT false,
    "hasCofinsRetention" BOOLEAN NOT NULL DEFAULT false,
    "isServiceExport" BOOLEAN NOT NULL DEFAULT false,
    "incidenceMunicipality" "IssIncidenceMunicipality",
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FiscalService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CfopTable" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "operationType" "CfopOperationType" NOT NULL,
    "creditImpact" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CfopTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CstTable" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "taxType" "CstTaxType" NOT NULL,
    "entryExit" "CstEntryExit",
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CstTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NcmTable" (
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),

    CONSTRAINT "NcmTable_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "CestTable" (
    "code" TEXT NOT NULL,
    "ncm" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),

    CONSTRAINT "CestTable_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "OperationNature" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cfop" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationNature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FiscalProduct_clientId_internalCode_key" ON "FiscalProduct"("clientId", "internalCode");

-- CreateIndex
CREATE UNIQUE INDEX "FiscalService_clientId_internalCode_key" ON "FiscalService"("clientId", "internalCode");

-- CreateIndex
CREATE UNIQUE INDEX "CfopTable_code_key" ON "CfopTable"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CstTable_code_taxType_key" ON "CstTable"("code", "taxType");

-- AddForeignKey
ALTER TABLE "FiscalProduct" ADD CONSTRAINT "FiscalProduct_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalService" ADD CONSTRAINT "FiscalService_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationNature" ADD CONSTRAINT "OperationNature_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
