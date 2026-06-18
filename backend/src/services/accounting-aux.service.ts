import { prisma } from '../prisma/client.js';

// ── Centros de Custo ──────────────────────────────────────────────────────────

export async function listCostCenters(clientId: string) {
  return prisma.costCenter.findMany({
    where: { clientId },
    include: { parent: { select: { id: true, code: true, name: true } } },
    orderBy: { code: 'asc' },
  });
}

export async function createCostCenter(clientId: string, data: {
  code: string; name: string; type: string; level?: number;
  parentId?: string | null; required?: boolean; notes?: string;
}) {
  return prisma.costCenter.create({
    data: {
      clientId,
      code: data.code,
      name: data.name,
      type: data.type as never,
      level: data.level ?? 1,
      parentId: data.parentId,
      required: data.required ?? false,
      notes: data.notes,
    },
  });
}

export async function updateCostCenter(id: string, data: Partial<{
  code: string; name: string; type: string; level: number;
  parentId: string | null; required: boolean; active: boolean; notes: string;
}>) {
  return prisma.costCenter.update({ where: { id }, data: { ...data, type: data.type as never } });
}

export async function deleteCostCenter(id: string) {
  const children = await prisma.costCenter.count({ where: { parentId: id } });
  if (children > 0) throw new Error('Centro com filhos não pode ser excluído.');
  return prisma.costCenter.delete({ where: { id } });
}

// ── Históricos Padrão ─────────────────────────────────────────────────────────

export async function listStandardHistories(clientId: string, search?: string) {
  return prisma.standardHistory.findMany({
    where: {
      clientId,
      ...(search ? { OR: [{ code: { contains: search, mode: 'insensitive' } }, { text: { contains: search, mode: 'insensitive' } }] } : {}),
    },
    orderBy: { code: 'asc' },
  });
}

export async function createStandardHistory(clientId: string, data: {
  code: string; text: string; complement?: string;
}) {
  return prisma.standardHistory.create({ data: { clientId, ...data } });
}

export async function updateStandardHistory(id: string, data: Partial<{
  code: string; text: string; complement: string; active: boolean;
}>) {
  return prisma.standardHistory.update({ where: { id }, data });
}

export async function deleteStandardHistory(id: string) {
  return prisma.standardHistory.delete({ where: { id } });
}

// ── Tipos de Lançamento ───────────────────────────────────────────────────────

export async function listEntryTypes(clientId: string) {
  return prisma.entryType.findMany({ where: { clientId }, orderBy: { code: 'asc' } });
}

export async function createEntryType(clientId: string, data: {
  code: string; name: string; classification: string;
  appearsInReports?: boolean; allowsReversal?: boolean; notes?: string;
}) {
  return prisma.entryType.create({
    data: {
      clientId,
      code: data.code,
      name: data.name,
      classification: data.classification as never,
      appearsInReports: data.appearsInReports ?? true,
      allowsReversal: data.allowsReversal ?? true,
      notes: data.notes,
    },
  });
}

export async function updateEntryType(id: string, data: Partial<{
  code: string; name: string; classification: string;
  appearsInReports: boolean; allowsReversal: boolean; active: boolean; notes: string;
}>) {
  return prisma.entryType.update({ where: { id }, data: { ...data, classification: data.classification as never } });
}

export async function deleteEntryType(id: string) {
  return prisma.entryType.delete({ where: { id } });
}

// ── Parâmetros Contábeis ──────────────────────────────────────────────────────

export async function getParameters(clientId: string) {
  return prisma.accountingParameters.findUnique({ where: { clientId } });
}

export async function upsertParameters(clientId: string, data: {
  closingMethod?: string;
  costCenterRequired?: boolean;
  integrateFiscal?: boolean;
  integratePayroll?: boolean;
  integrateFinancial?: boolean;
  integratePatrimony?: boolean;
  integrateBilling?: boolean;
  closedPeriods?: string[];
  currentYear?: number;
  resultAccountId?: string | null;
  retainedEarningsAccId?: string | null;
}) {
  const payload = { ...data, closingMethod: data.closingMethod as never };
  return prisma.accountingParameters.upsert({
    where: { clientId },
    update: payload,
    create: { clientId, ...payload },
  });
}

export async function togglePeriod(clientId: string, period: string) {
  const params = await prisma.accountingParameters.findUnique({ where: { clientId } });
  const current = params?.closedPeriods ?? [];
  const next = current.includes(period)
    ? current.filter((p) => p !== period)
    : [...current, period];
  return prisma.accountingParameters.upsert({
    where: { clientId },
    update: { closedPeriods: next },
    create: { clientId, closedPeriods: next },
  });
}
