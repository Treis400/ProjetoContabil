import { FiscalEntryExit, Prisma, ValidationStatus } from '@prisma/client';
import { prisma } from '../prisma/client.js';
import { AppError } from '../utils/app-error.js';
import { validateFiscalDocument, deriveValidationStatus } from './fiscal-document-validator.service.js';
import { parseNFeXml, parseCTeXml } from './fiscal-xml-parser.service.js';

const documentInclude = {
  items: { orderBy: { itemNumber: 'asc' as const } },
  createdBy: { select: { id: true, name: true } },
} satisfies Prisma.FiscalDocumentInclude;

export type DocumentFilters = {
  clientId: string;
  entryExit?: FiscalEntryExit;
  documentType?: string;
  status?: string;
  periodYear?: number;
  periodMonth?: number;
  search?: string;
};

export async function listFiscalDocuments(filters: DocumentFilters) {
  const where: Prisma.FiscalDocumentWhereInput = {
    clientId: filters.clientId,
    ...(filters.entryExit ? { entryExit: filters.entryExit } : {}),
    ...(filters.documentType ? { documentType: filters.documentType as never } : {}),
    ...(filters.status ? { status: filters.status as never } : {}),
    ...(filters.periodYear ? { periodYear: filters.periodYear } : {}),
    ...(filters.periodMonth ? { periodMonth: filters.periodMonth } : {}),
    ...(filters.search
      ? {
          OR: [
            { documentNumber: { contains: filters.search } },
            { nameIssuer: { contains: filters.search, mode: 'insensitive' } },
            { nameRecipient: { contains: filters.search, mode: 'insensitive' } },
            { cnpjIssuer: { contains: filters.search } },
            { accessKey: { contains: filters.search } },
          ],
        }
      : {}),
  };

  return prisma.fiscalDocument.findMany({
    where,
    include: { _count: { select: { items: true } } },
    orderBy: [{ issueDate: 'desc' }, { documentNumber: 'desc' }],
  });
}

export async function getFiscalDocumentById(id: string) {
  const doc = await prisma.fiscalDocument.findUnique({
    where: { id },
    include: documentInclude,
  });
  if (!doc) throw new AppError('Documento fiscal não encontrado.', 404);
  return doc;
}

type ItemInput = {
  itemNumber: number;
  productCode?: string | null;
  description: string;
  ncm?: string | null;
  cfop: string;
  unitOfMeasure?: string | null;
  quantity: number;
  unitValue: number;
  totalValue: number;
  discount?: number;
  cstIcms?: string | null;
  csosnIcms?: string | null;
  cstIpi?: string | null;
  cstPisCofins?: string | null;
  baseIcms?: number;
  icmsRate?: number;
  valueIcms?: number;
  baseIcmsSt?: number;
  icmsStRate?: number;
  valueIcmsSt?: number;
  ipiRate?: number;
  valueIpi?: number;
  pisRate?: number;
  valuePis?: number;
  cofinsRate?: number;
  valueCofins?: number;
  allowsCredit?: boolean;
};

type DocumentInput = {
  clientId: string;
  documentType: string;
  entryExit: string;
  status?: string | null;
  origin?: string | null;
  documentNumber: string;
  series?: string | null;
  accessKey?: string | null;
  issueDate: Date | string;
  entryExitDate?: Date | string | null;
  cnpjIssuer: string;
  nameIssuer: string;
  stateRegIssuer?: string | null;
  ufIssuer?: string | null;
  cnpjRecipient?: string | null;
  nameRecipient?: string | null;
  stateRegRecipient?: string | null;
  ufRecipient?: string | null;
  totalProducts?: number | null;
  totalDocument?: number | null;
  totalFreight?: number | null;
  totalInsurance?: number | null;
  totalDiscount?: number | null;
  totalOther?: number | null;
  baseIcms?: number | null;
  valueIcms?: number | null;
  baseIcmsSt?: number | null;
  valueIcmsSt?: number | null;
  valueIpi?: number | null;
  valuePis?: number | null;
  valueCofins?: number | null;
  baseIss?: number | null;
  valueIss?: number | null;
  valueIssRetained?: number | null;
  valueInss?: number | null;
  valueIrrf?: number | null;
  valueCsll?: number | null;
  xmlContent?: string | null;
  notes?: string | null;
  periodMonth?: number | null;
  periodYear?: number | null;
  items: ItemInput[];
};

function toD(v: number | string | Prisma.Decimal | undefined | null): Prisma.Decimal {
  return new Prisma.Decimal(String(v ?? 0));
}

function buildItems(items: ItemInput[], documentId: string): Prisma.FiscalDocumentItemCreateManyInput[] {
  return items.map((item) => ({
    documentId,
    itemNumber: item.itemNumber,
    productCode: item.productCode ?? null,
    description: item.description,
    ncm: item.ncm ?? null,
    cfop: item.cfop,
    unitOfMeasure: item.unitOfMeasure ?? null,
    quantity: toD(item.quantity),
    unitValue: toD(item.unitValue),
    totalValue: toD(item.totalValue),
    discount: toD(item.discount),
    cstIcms: item.cstIcms ?? null,
    csosnIcms: item.csosnIcms ?? null,
    cstIpi: item.cstIpi ?? null,
    cstPisCofins: item.cstPisCofins ?? null,
    baseIcms: toD(item.baseIcms),
    icmsRate: toD(item.icmsRate),
    valueIcms: toD(item.valueIcms),
    baseIcmsSt: toD(item.baseIcmsSt),
    icmsStRate: toD(item.icmsStRate),
    valueIcmsSt: toD(item.valueIcmsSt),
    ipiRate: toD(item.ipiRate),
    valueIpi: toD(item.valueIpi),
    pisRate: toD(item.pisRate),
    valuePis: toD(item.valuePis),
    cofinsRate: toD(item.cofinsRate),
    valueCofins: toD(item.valueCofins),
    allowsCredit: item.allowsCredit ?? false,
  }));
}

export async function createFiscalDocument(data: DocumentInput, userId: string) {
  // Verificar chave de acesso duplicada
  if (data.accessKey) {
    const existing = await prisma.fiscalDocument.findUnique({ where: { accessKey: data.accessKey } });
    if (existing) throw new AppError('Já existe um documento com esta chave de acesso.', 409);
  }

  const errors = validateFiscalDocument({
    documentType: data.documentType,
    entryExit: data.entryExit,
    cnpjIssuer: data.cnpjIssuer,
    cnpjRecipient: data.cnpjRecipient,
    accessKey: data.accessKey,
    issueDate: new Date(data.issueDate),
    entryExitDate: data.entryExitDate ? new Date(data.entryExitDate) : undefined,
    totalProducts: toD(data.totalProducts),
    totalDocument: toD(data.totalDocument),
    baseIcms: toD(data.baseIcms),
    valueIcms: toD(data.valueIcms),
    items: data.items,
  });

  const validationStatus = deriveValidationStatus(errors) as ValidationStatus;

  const doc = await prisma.$transaction(async (tx) => {
    const created = await tx.fiscalDocument.create({
      data: {
        clientId: data.clientId,
        documentType: data.documentType as never,
        entryExit: data.entryExit as never,
        status: (data.status ?? 'REGULAR') as never,
        origin: (data.origin ?? 'DIGITACAO_MANUAL') as never,
        documentNumber: data.documentNumber,
        series: data.series ?? null,
        accessKey: data.accessKey ?? null,
        issueDate: new Date(data.issueDate),
        entryExitDate: data.entryExitDate ? new Date(data.entryExitDate) : null,
        cnpjIssuer: data.cnpjIssuer,
        nameIssuer: data.nameIssuer,
        stateRegIssuer: data.stateRegIssuer ?? null,
        ufIssuer: data.ufIssuer ?? null,
        cnpjRecipient: data.cnpjRecipient ?? null,
        nameRecipient: data.nameRecipient ?? null,
        stateRegRecipient: data.stateRegRecipient ?? null,
        ufRecipient: data.ufRecipient ?? null,
        totalProducts: toD(data.totalProducts),
        totalDocument: toD(data.totalDocument),
        totalFreight: toD(data.totalFreight),
        totalInsurance: toD(data.totalInsurance),
        totalDiscount: toD(data.totalDiscount),
        totalOther: toD(data.totalOther),
        baseIcms: toD(data.baseIcms),
        valueIcms: toD(data.valueIcms),
        baseIcmsSt: toD(data.baseIcmsSt),
        valueIcmsSt: toD(data.valueIcmsSt),
        valueIpi: toD(data.valueIpi),
        valuePis: toD(data.valuePis),
        valueCofins: toD(data.valueCofins),
        baseIss: toD(data.baseIss),
        valueIss: toD(data.valueIss),
        valueIssRetained: toD(data.valueIssRetained),
        valueInss: toD(data.valueInss),
        valueIrrf: toD(data.valueIrrf),
        valueCsll: toD(data.valueCsll),
        xmlContent: data.xmlContent ?? null,
        validationStatus,
        validationErrors: errors.length > 0 ? errors : Prisma.JsonNull,
        notes: data.notes ?? null,
        periodMonth: data.periodMonth ?? null,
        periodYear: data.periodYear ?? null,
        createdById: userId,
      },
    });

    if (data.items.length > 0) {
      await tx.fiscalDocumentItem.createMany({ data: buildItems(data.items, created.id) });
    }

    return created;
  });

  return prisma.fiscalDocument.findUniqueOrThrow({ where: { id: doc.id }, include: documentInclude });
}

export async function importFiscalDocumentFromXml(clientId: string, xmlContent: string, entryExit: FiscalEntryExit, userId: string) {
  // Detectar tipo pelo conteúdo
  let parsed;
  if (xmlContent.includes('<infNFe') || xmlContent.includes('<NFe')) {
    parsed = parseNFeXml(xmlContent);
  } else if (xmlContent.includes('<infCte') || xmlContent.includes('<CTe')) {
    parsed = parseCTeXml(xmlContent);
  } else {
    throw new AppError('Formato de XML não suportado. Envie NF-e ou CT-e.', 400);
  }

  // Determinar período pela data de emissão
  const issueDate = parsed.issueDate;
  const periodMonth = issueDate.getMonth() + 1;
  const periodYear = issueDate.getFullYear();

  return createFiscalDocument(
    {
      ...parsed,
      clientId,
      entryExit,
      origin: 'XML_IMPORTADO',
      xmlContent,
      periodMonth,
      periodYear,
    },
    userId,
  );
}

export async function updateFiscalDocumentStatus(id: string, status: string) {
  await getFiscalDocumentById(id);
  return prisma.fiscalDocument.update({
    where: { id },
    data: { status: status as never },
    include: documentInclude,
  });
}

export async function deleteFiscalDocument(id: string) {
  await getFiscalDocumentById(id);
  await prisma.fiscalDocument.delete({ where: { id } });
}

export async function revalidateDocument(id: string) {
  const doc = await prisma.fiscalDocument.findUniqueOrThrow({
    where: { id },
    include: { items: true },
  });

  const errors = validateFiscalDocument({
    documentType: doc.documentType,
    entryExit: doc.entryExit,
    cnpjIssuer: doc.cnpjIssuer,
    cnpjRecipient: doc.cnpjRecipient,
    accessKey: doc.accessKey,
    issueDate: doc.issueDate,
    entryExitDate: doc.entryExitDate ?? undefined,
    totalProducts: doc.totalProducts,
    totalDocument: doc.totalDocument,
    baseIcms: doc.baseIcms,
    valueIcms: doc.valueIcms,
    items: doc.items,
  });

  const validationStatus = deriveValidationStatus(errors) as ValidationStatus;

  return prisma.fiscalDocument.update({
    where: { id },
    data: {
      validationStatus,
      validationErrors: errors.length > 0 ? errors : Prisma.JsonNull,
    },
    include: documentInclude,
  });
}
