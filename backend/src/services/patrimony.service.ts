import { prisma } from '../prisma/client.js';
import type {
  PatrimonyDeprecMethod, PatrimonyAssetStatus,
  PatrimonyAcquisitionType, PatrimonyMovementType,
  PatrimonyDisposalType, PatrimonyRevaluationType,
} from '@prisma/client';

// ── Grupos ────────────────────────────────────────────────────────────────────

export async function listGroups(clientId: string) {
  return prisma.patrimonyGroup.findMany({
    where: { clientId },
    orderBy: { code: 'asc' },
    include: { children: { orderBy: { code: 'asc' } } },
  });
}

export async function createGroup(clientId: string, data: {
  code: string; name: string; parentId?: string;
  deprecMethod?: PatrimonyDeprecMethod; usefulLifeYears?: number; annualRate?: number;
  residualValuePct?: number; assetAccountCode?: string;
  accumDeprecAccountCode?: string; deprecExpenseAccountCode?: string; notes?: string;
}) {
  return prisma.patrimonyGroup.create({ data: { clientId, ...data } });
}

export async function updateGroup(id: string, data: any) {
  return prisma.patrimonyGroup.update({ where: { id }, data });
}

export async function deleteGroup(id: string) {
  return prisma.patrimonyGroup.delete({ where: { id } });
}

// ── Localizações ──────────────────────────────────────────────────────────────

export async function listLocations(clientId: string) {
  return prisma.patrimonyLocation.findMany({
    where: { clientId },
    orderBy: { code: 'asc' },
    include: { children: { orderBy: { code: 'asc' } } },
  });
}

export async function createLocation(clientId: string, data: {
  code: string; name: string; type?: string; parentId?: string;
}) {
  return prisma.patrimonyLocation.create({ data: { clientId, ...data } });
}

export async function updateLocation(id: string, data: any) {
  return prisma.patrimonyLocation.update({ where: { id }, data });
}

export async function deleteLocation(id: string) {
  return prisma.patrimonyLocation.delete({ where: { id } });
}

// ── Responsáveis ──────────────────────────────────────────────────────────────

export async function listResponsibles(clientId: string) {
  return prisma.patrimonyResponsible.findMany({
    where: { clientId },
    orderBy: { name: 'asc' },
  });
}

export async function createResponsible(clientId: string, data: {
  name: string; role?: string; sector?: string; email?: string;
}) {
  return prisma.patrimonyResponsible.create({ data: { clientId, ...data } });
}

export async function updateResponsible(id: string, data: any) {
  return prisma.patrimonyResponsible.update({ where: { id }, data });
}

export async function deleteResponsible(id: string) {
  return prisma.patrimonyResponsible.delete({ where: { id } });
}

// ── Bens ──────────────────────────────────────────────────────────────────────

export async function listAssets(clientId: string, filters?: {
  groupId?: string; locationId?: string; status?: PatrimonyAssetStatus;
  responsibleId?: string;
}) {
  return prisma.patrimonyAsset.findMany({
    where: {
      clientId,
      ...(filters?.groupId ? { groupId: filters.groupId } : {}),
      ...(filters?.locationId ? { locationId: filters.locationId } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.responsibleId ? { responsibleId: filters.responsibleId } : {}),
    },
    orderBy: { tombamento: 'asc' },
    include: { group: true, location: true, responsible: true },
  });
}

export async function getAsset(id: string) {
  return prisma.patrimonyAsset.findUniqueOrThrow({
    where: { id },
    include: {
      group: true, location: true, responsible: true,
      depreciations: { orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }] },
      movements: { orderBy: { movementDate: 'desc' } },
      revaluations: { orderBy: { revaluationDate: 'desc' } },
      disposals: true,
    },
  });
}

export async function createAsset(clientId: string, data: {
  tombamento: string; description: string; groupId?: string;
  locationId?: string; responsibleId?: string; costCenterCode?: string;
  acquisitionType?: PatrimonyAcquisitionType; acquisitionDate: Date; acquisitionValue: number;
  residualValue?: number; usefulLifeMonths?: number; usefulLifeMonthsFiscal?: number;
  deprecMethod?: PatrimonyDeprecMethod; deprecStartDate?: Date;
  internalCode?: string; serialNumber?: string; brand?: string; model?: string;
  manufacturer?: string; barcode?: string; documentOrigin?: string;
  assetAccountCode?: string; accumDeprecAccountCode?: string;
  deprecExpenseAccountCode?: string; technicalNotes?: string; oldTombamento?: string;
}) {
  return prisma.patrimonyAsset.create({ data: { clientId, ...data } });
}

export async function updateAsset(id: string, data: any) {
  return prisma.patrimonyAsset.update({ where: { id }, data });
}

// ── Movimentação ──────────────────────────────────────────────────────────────

export async function createMovement(assetId: string, data: {
  type: PatrimonyMovementType; movementDate: Date;
  fromLocationId?: string; toLocationId?: string;
  fromResponsibleId?: string; toResponsibleId?: string;
  fromStatus?: PatrimonyAssetStatus; toStatus?: PatrimonyAssetStatus;
  reason?: string; document?: string; notes?: string;
}) {
  const movement = await prisma.patrimonyMovement.create({ data: { assetId, ...data } });

  // Atualiza o bem
  const updateData: any = {};
  if (data.toLocationId) updateData.locationId = data.toLocationId;
  if (data.toResponsibleId) updateData.responsibleId = data.toResponsibleId;
  if (data.toStatus) updateData.status = data.toStatus;
  if (Object.keys(updateData).length > 0) {
    await prisma.patrimonyAsset.update({ where: { id: assetId }, data: updateData });
  }

  return movement;
}

// ── Depreciação ───────────────────────────────────────────────────────────────

export async function calcDepreciation(clientId: string, periodMonth: number, periodYear: number) {
  const assets = await prisma.patrimonyAsset.findMany({
    where: {
      clientId,
      status: { in: ['ATIVO', 'ARRENDADO', 'CEDIDO'] },
      deprecSuspended: false,
      deprecStartDate: { lte: new Date(periodYear, periodMonth - 1, 28) },
    },
    include: { group: true },
  });

  const results = [];

  for (const asset of assets) {
    const existing = await prisma.patrimonyDepreciation.findUnique({
      where: { assetId_periodYear_periodMonth: { assetId: asset.id, periodYear, periodMonth } },
    });
    if (existing) { results.push(existing); continue; }

    const usefulLifeMonths = asset.usefulLifeMonths ?? 60;
    const acquisitionValue = Number(asset.acquisitionValue);
    const residualValue = Number(asset.residualValue ?? 0);
    const depreciableValue = acquisitionValue - residualValue;

    let monthlyDeprec = 0;
    if (asset.deprecMethod === 'LINEAR') {
      monthlyDeprec = usefulLifeMonths > 0 ? depreciableValue / usefulLifeMonths : 0;
    }

    // Busca acumulado anterior
    const prevDeprec = await prisma.patrimonyDepreciation.findFirst({
      where: { assetId: asset.id },
      orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
    });

    const accumDeprecOpen = prevDeprec ? Number(prevDeprec.accumDeprecClose) : 0;
    const openingValue = acquisitionValue - accumDeprecOpen;

    // Não deprecia além do valor depreciável
    const remainingDeprec = depreciableValue - accumDeprecOpen;
    if (remainingDeprec <= 0) continue;

    const actualMonthlyDeprec = Math.min(monthlyDeprec, remainingDeprec);
    const accumDeprecClose = accumDeprecOpen + actualMonthlyDeprec;
    const closingValue = acquisitionValue - accumDeprecClose;

    const d = await prisma.patrimonyDepreciation.create({
      data: {
        assetId: asset.id, periodMonth, periodYear,
        openingValue, accumDeprecOpen, monthlyDeprec: actualMonthlyDeprec,
        accumDeprecClose, closingValue, fiscalDeprec: actualMonthlyDeprec,
      },
    });
    results.push(d);
  }

  return results;
}

export async function getDepreciationSummary(clientId: string, periodMonth: number, periodYear: number) {
  const records = await prisma.patrimonyDepreciation.findMany({
    where: {
      periodMonth, periodYear,
      asset: { clientId },
    },
    include: {
      asset: { include: { group: true } },
    },
  });

  const totalMonthlyDeprec = records.reduce((s, r) => s + Number(r.monthlyDeprec), 0);
  const totalAccumDeprec = records.reduce((s, r) => s + Number(r.accumDeprecClose), 0);

  return { records, totalMonthlyDeprec, totalAccumDeprec, count: records.length };
}

// ── Reavaliação ───────────────────────────────────────────────────────────────

export async function createRevaluation(assetId: string, data: {
  type: PatrimonyRevaluationType; revaluationDate: Date; newValue: number;
  expertReport?: string; accountCode?: string; entryRef?: string; notes?: string;
}) {
  const asset = await prisma.patrimonyAsset.findUniqueOrThrow({ where: { id: assetId } });
  const previousValue = Number(asset.acquisitionValue);
  const adjustment = data.newValue - previousValue;

  const rev = await prisma.patrimonyRevaluation.create({
    data: { assetId, previousValue, adjustment, ...data },
  });

  await prisma.patrimonyAsset.update({
    where: { id: assetId },
    data: { acquisitionValue: data.newValue },
  });

  return rev;
}

// ── Baixa ─────────────────────────────────────────────────────────────────────

export async function createDisposal(assetId: string, data: {
  type: PatrimonyDisposalType; disposalDate: Date; saleValue?: number;
  documentRef?: string; entryRef?: string; notes?: string;
}) {
  const asset = await prisma.patrimonyAsset.findUniqueOrThrow({ where: { id: assetId } });

  const lastDeprec = await prisma.patrimonyDepreciation.findFirst({
    where: { assetId },
    orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
  });

  const accumDeprec = lastDeprec ? Number(lastDeprec.accumDeprecClose) : 0;
  const bookValue = Number(asset.acquisitionValue) - accumDeprec;
  const saleValue = data.saleValue ?? 0;
  const gainLoss = saleValue - bookValue;
  const finalDeprec = accumDeprec;

  const disposal = await prisma.patrimonyDisposal.create({
    data: { assetId, bookValue, gainLoss, finalDeprec, ...data, saleValue },
  });

  await prisma.patrimonyAsset.update({
    where: { id: assetId },
    data: { status: 'BAIXADO', active: false },
  });

  return disposal;
}

// ── Inventário ────────────────────────────────────────────────────────────────

export async function listInventories(clientId: string) {
  return prisma.patrimonyInventory.findMany({
    where: { clientId },
    orderBy: { startDate: 'desc' },
    include: { _count: { select: { items: true } } },
  });
}

export async function createInventory(clientId: string, data: {
  name: string; startDate: Date; notes?: string;
}) {
  const inventory = await prisma.patrimonyInventory.create({ data: { clientId, ...data } });

  // Gera itens para todos os ativos ativos
  const assets = await prisma.patrimonyAsset.findMany({
    where: { clientId, status: { not: 'BAIXADO' } },
    select: { id: true },
  });

  if (assets.length > 0) {
    await prisma.patrimonyInventoryItem.createMany({
      data: assets.map(a => ({ inventoryId: inventory.id, assetId: a.id })),
    });
  }

  return inventory;
}

export async function getInventory(id: string) {
  return prisma.patrimonyInventory.findUniqueOrThrow({
    where: { id },
    include: {
      items: {
        include: { asset: { include: { group: true, location: true, responsible: true } } },
      },
    },
  });
}

export async function updateInventoryItem(id: string, data: {
  found?: boolean; foundLocation?: string; foundCondition?: string;
  notes?: string; checkedAt?: Date;
}) {
  return prisma.patrimonyInventoryItem.update({ where: { id }, data });
}

export async function closeInventory(id: string) {
  return prisma.patrimonyInventory.update({
    where: { id },
    data: { status: 'CONCLUIDO', endDate: new Date() },
  });
}

// ── Encerramento ──────────────────────────────────────────────────────────────

export async function listPeriodClosings(clientId: string) {
  return prisma.periodClosing.findMany({
    where: { clientId },
    orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
  });
}

export async function closePeriod(clientId: string, periodMonth: number, periodYear: number, userId: string) {
  return prisma.periodClosing.upsert({
    where: { clientId_periodYear_periodMonth: { clientId, periodYear, periodMonth } },
    update: { status: 'FECHADO', closedAt: new Date(), closedById: userId },
    create: {
      clientId, periodMonth, periodYear,
      status: 'FECHADO', closedAt: new Date(), closedById: userId,
    },
  });
}

export async function reopenPeriod(clientId: string, periodMonth: number, periodYear: number, userId: string, reason: string) {
  return prisma.periodClosing.update({
    where: { clientId_periodYear_periodMonth: { clientId, periodYear, periodMonth } },
    data: { status: 'ABERTO', reopenedAt: new Date(), reopenedById: userId, reopenReason: reason },
  });
}

export async function isPeriodClosed(clientId: string, periodMonth: number, periodYear: number): Promise<boolean> {
  const closing = await prisma.periodClosing.findUnique({
    where: { clientId_periodYear_periodMonth: { clientId, periodYear, periodMonth } },
  });
  return closing?.status === 'FECHADO';
}
