import { Prisma } from '@prisma/client';
import { prisma } from '../prisma/client.js';
import { calculateApuration } from './tax-apuration-engine.service.js';

const D = (v: number | string | null | undefined): Prisma.Decimal =>
  new Prisma.Decimal(String(v ?? 0));

// ── Listagem ──────────────────────────────────────────────────────────────────

export async function listApurations(clientId: string, year?: number) {
  return prisma.taxApuration.findMany({
    where: { clientId, ...(year ? { periodYear: year } : {}) },
    include: {
      result: true,
      _count: { select: { adjustments: true, simplesRevenues: true } },
    },
    orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }, { taxType: 'asc' }],
  });
}

// ── Detalhe ───────────────────────────────────────────────────────────────────

export async function getApuration(id: string) {
  return prisma.taxApuration.findUniqueOrThrow({
    where: { id },
    include: {
      result: true,
      adjustments: { orderBy: { createdAt: 'asc' } },
      simplesRevenues: { orderBy: { annex: 'asc' } },
      client: { select: { id: true, companyName: true, tradeName: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });
}

// ── Criação ───────────────────────────────────────────────────────────────────

export async function createApuration(data: {
  clientId: string;
  taxType: string;
  periodMonth: number;
  periodYear: number;
  notes?: string;
  userId?: string;
  simplesRevenues?: { annex: string; totalRevenue: number; revenueWithSt?: number; revenueMonophasic?: number; revenueIssRetained?: number }[];
}) {
  return prisma.taxApuration.create({
    data: {
      clientId: data.clientId,
      taxType: data.taxType as never,
      periodMonth: data.periodMonth,
      periodYear: data.periodYear,
      notes: data.notes,
      createdById: data.userId,
      simplesRevenues: data.simplesRevenues?.length
        ? {
            create: data.simplesRevenues.map((r) => ({
              annex: r.annex,
              totalRevenue: D(r.totalRevenue),
              revenueWithSt: D(r.revenueWithSt),
              revenueMonophasic: D(r.revenueMonophasic),
              revenueIssRetained: D(r.revenueIssRetained),
            })),
          }
        : undefined,
    },
    include: { result: true, adjustments: true, simplesRevenues: true },
  });
}

// ── Calcular ──────────────────────────────────────────────────────────────────

export async function calcApuration(id: string) {
  await calculateApuration(id);
  return getApuration(id);
}

// ── Encerrar ──────────────────────────────────────────────────────────────────

export async function closeApuration(id: string) {
  const ap = await prisma.taxApuration.findUniqueOrThrow({ where: { id }, include: { result: true } });
  if (ap.status !== 'CALCULADA') throw new Error('Apuração precisa estar calculada antes de ser encerrada.');
  return prisma.taxApuration.update({
    where: { id },
    data: { status: 'ENCERRADA', closedAt: new Date() },
    include: { result: true, adjustments: true, simplesRevenues: true },
  });
}

// ── Reabrir ───────────────────────────────────────────────────────────────────

export async function reopenApuration(id: string) {
  return prisma.taxApuration.update({
    where: { id },
    data: { status: 'ABERTA', calculatedAt: null, closedAt: null },
    include: { result: true, adjustments: true, simplesRevenues: true },
  });
}

// ── Ajustes ───────────────────────────────────────────────────────────────────

export async function addAdjustment(data: {
  apurationId: string;
  type: string;
  description: string;
  value: number;
  documentRef?: string;
}) {
  return prisma.taxApurationAdjustment.create({
    data: {
      apurationId: data.apurationId,
      type: data.type as never,
      description: data.description,
      value: D(data.value),
      documentRef: data.documentRef,
    },
  });
}

export async function removeAdjustment(id: string) {
  return prisma.taxApurationAdjustment.delete({ where: { id } });
}

// ── Receitas Simples ──────────────────────────────────────────────────────────

export async function upsertSimplesRevenue(data: {
  apurationId: string;
  annex: string;
  totalRevenue: number;
  revenueWithSt?: number;
  revenueMonophasic?: number;
  revenueIssRetained?: number;
}) {
  return prisma.taxApurationSimplesRevenue.upsert({
    where: { apurationId_annex: { apurationId: data.apurationId, annex: data.annex } },
    update: {
      totalRevenue: D(data.totalRevenue),
      revenueWithSt: D(data.revenueWithSt),
      revenueMonophasic: D(data.revenueMonophasic),
      revenueIssRetained: D(data.revenueIssRetained),
    },
    create: {
      apurationId: data.apurationId,
      annex: data.annex,
      totalRevenue: D(data.totalRevenue),
      revenueWithSt: D(data.revenueWithSt),
      revenueMonophasic: D(data.revenueMonophasic),
      revenueIssRetained: D(data.revenueIssRetained),
    },
  });
}

// ── Excluir ───────────────────────────────────────────────────────────────────

export async function deleteApuration(id: string) {
  const ap = await prisma.taxApuration.findUniqueOrThrow({ where: { id } });
  if (ap.status === 'ENCERRADA') throw new Error('Apuração encerrada não pode ser excluída.');
  return prisma.taxApuration.delete({ where: { id } });
}
