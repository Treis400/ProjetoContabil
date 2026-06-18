import { prisma } from '../prisma/client.js';
import type { DebitCredit, EntryStatus, EntrySource } from '@prisma/client';

export interface EntryLineInput {
  lineNumber: number;
  accountId: string;
  costCenterId?: string | null;
  historyId?: string | null;
  complement?: string | null;
  debitCredit: DebitCredit;
  value: number;
}

export interface CreateEntryInput {
  clientId: string;
  entryDate: string;
  description: string;
  entryTypeId?: string | null;
  source?: EntrySource;
  documentRef?: string | null;
  lines: EntryLineInput[];
}

export interface UpdateEntryInput {
  entryDate?: string;
  description?: string;
  entryTypeId?: string | null;
  documentRef?: string | null;
  lines?: EntryLineInput[];
}

export interface ListEntriesFilter {
  clientId: string;
  periodMonth?: number;
  periodYear?: number;
  status?: EntryStatus;
  accountId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

function parsePeriod(date: Date) {
  return { periodMonth: date.getMonth() + 1, periodYear: date.getFullYear() };
}

async function nextEntryNumber(clientId: string): Promise<number> {
  const last = await prisma.accountingEntry.findFirst({
    where: { clientId },
    orderBy: { entryNumber: 'desc' },
    select: { entryNumber: true },
  });
  return (last?.entryNumber ?? 0) + 1;
}

function validateLines(lines: EntryLineInput[]) {
  if (!lines || lines.length < 2) throw new Error('O lançamento deve ter pelo menos 2 partidas.');
  const totalDebits  = lines.filter(l => l.debitCredit === 'DEBITO').reduce((s, l) => s + Number(l.value), 0);
  const totalCredits = lines.filter(l => l.debitCredit === 'CREDITO').reduce((s, l) => s + Number(l.value), 0);
  if (Math.abs(totalDebits - totalCredits) > 0.005) {
    throw new Error(`Lançamento desequilibrado: débitos ${totalDebits.toFixed(2)} ≠ créditos ${totalCredits.toFixed(2)}.`);
  }
}

export async function listEntries(filter: ListEntriesFilter) {
  const page  = filter.page  ?? 1;
  const limit = filter.limit ?? 50;
  const skip  = (page - 1) * limit;

  const where: Record<string, unknown> = { clientId: filter.clientId };
  if (filter.periodMonth) where['periodMonth'] = filter.periodMonth;
  if (filter.periodYear)  where['periodYear']  = filter.periodYear;
  if (filter.status)      where['status']      = filter.status;
  if (filter.search)      where['description'] = { contains: filter.search, mode: 'insensitive' };
  if (filter.dateFrom || filter.dateTo) {
    where['entryDate'] = {
      ...(filter.dateFrom ? { gte: new Date(filter.dateFrom) } : {}),
      ...(filter.dateTo   ? { lte: new Date(filter.dateTo)   } : {}),
    };
  }
  if (filter.accountId) {
    where['lines'] = { some: { accountId: filter.accountId } };
  }

  const [total, data] = await Promise.all([
    prisma.accountingEntry.count({ where }),
    prisma.accountingEntry.findMany({
      where,
      orderBy: [{ entryDate: 'desc' }, { entryNumber: 'desc' }],
      skip,
      take: limit,
      include: {
        lines: {
          include: { entry: false },
          orderBy: { lineNumber: 'asc' },
        },
        createdBy: { select: { id: true, name: true } },
      },
    }),
  ]);

  return { data, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getEntry(id: string) {
  const entry = await prisma.accountingEntry.findUnique({
    where: { id },
    include: {
      lines: { orderBy: { lineNumber: 'asc' } },
      createdBy: { select: { id: true, name: true } },
    },
  });
  if (!entry) throw new Error('Lançamento não encontrado.');
  return entry;
}

export async function createEntry(input: CreateEntryInput, userId?: string) {
  validateLines(input.lines);
  const date = new Date(input.entryDate);
  const { periodMonth, periodYear } = parsePeriod(date);
  const entryNumber = await nextEntryNumber(input.clientId);

  return prisma.accountingEntry.create({
    data: {
      clientId: input.clientId,
      entryNumber,
      entryDate: date,
      periodMonth,
      periodYear,
      description: input.description,
      entryTypeId: input.entryTypeId ?? null,
      source: input.source ?? 'MANUAL',
      documentRef: input.documentRef ?? null,
      status: 'CONFIRMADO',
      createdById: userId ?? null,
      lines: {
        create: input.lines.map(l => ({
          lineNumber: l.lineNumber,
          accountId: l.accountId,
          costCenterId: l.costCenterId ?? null,
          historyId: l.historyId ?? null,
          complement: l.complement ?? null,
          debitCredit: l.debitCredit,
          value: l.value,
        })),
      },
    },
    include: { lines: { orderBy: { lineNumber: 'asc' } } },
  });
}

export async function updateEntry(id: string, input: UpdateEntryInput) {
  const entry = await getEntry(id);
  if (entry.status === 'ESTORNADO') throw new Error('Não é possível editar um lançamento estornado.');

  if (input.lines) validateLines(input.lines);

  const date = input.entryDate ? new Date(input.entryDate) : undefined;
  const period = date ? parsePeriod(date) : {};

  return prisma.$transaction(async (tx) => {
    if (input.lines) {
      await tx.accountingEntryLine.deleteMany({ where: { entryId: id } });
    }
    return tx.accountingEntry.update({
      where: { id },
      data: {
        ...(date ? { entryDate: date, ...period } : {}),
        ...(input.description ? { description: input.description } : {}),
        ...(input.entryTypeId !== undefined ? { entryTypeId: input.entryTypeId } : {}),
        ...(input.documentRef !== undefined ? { documentRef: input.documentRef } : {}),
        ...(input.lines ? {
          lines: {
            create: input.lines.map(l => ({
              lineNumber: l.lineNumber,
              accountId: l.accountId,
              costCenterId: l.costCenterId ?? null,
              historyId: l.historyId ?? null,
              complement: l.complement ?? null,
              debitCredit: l.debitCredit,
              value: l.value,
            })),
          },
        } : {}),
      },
      include: { lines: { orderBy: { lineNumber: 'asc' } } },
    });
  });
}

export async function reverseEntry(id: string, userId?: string) {
  const entry = await getEntry(id);
  if (entry.status !== 'CONFIRMADO') throw new Error('Apenas lançamentos confirmados podem ser estornados.');

  const entryNumber = await nextEntryNumber(entry.clientId);
  const now = new Date();
  const { periodMonth, periodYear } = parsePeriod(now);

  return prisma.$transaction(async (tx) => {
    const reversal = await tx.accountingEntry.create({
      data: {
        clientId: entry.clientId,
        entryNumber,
        entryDate: now,
        periodMonth,
        periodYear,
        description: `ESTORNO: ${entry.description}`,
        source: 'ESTORNO',
        status: 'CONFIRMADO',
        reversedById: id,
        createdById: userId ?? null,
        lines: {
          create: entry.lines.map((l, i) => ({
            lineNumber: i + 1,
            accountId: l.accountId,
            costCenterId: l.costCenterId,
            historyId: l.historyId,
            complement: l.complement,
            debitCredit: l.debitCredit === 'DEBITO' ? 'CREDITO' : 'DEBITO',
            value: l.value,
          })),
        },
      },
      include: { lines: { orderBy: { lineNumber: 'asc' } } },
    });

    await tx.accountingEntry.update({
      where: { id },
      data: { status: 'ESTORNADO' },
    });

    return reversal;
  });
}

export async function deleteEntry(id: string) {
  const entry = await getEntry(id);
  if (entry.status === 'CONFIRMADO') throw new Error('Confirme o estorno antes de excluir um lançamento confirmado.');
  await prisma.accountingEntry.delete({ where: { id } });
}

// ── Razão Analítico ────────────────────────────────────────────────────────────

export async function getLedger(clientId: string, accountId: string, periodMonth?: number, periodYear?: number) {
  const where: Record<string, unknown> = {
    entry: {
      clientId,
      status: { not: 'ESTORNADO' },
      ...(periodMonth ? { periodMonth } : {}),
      ...(periodYear  ? { periodYear  } : {}),
    },
    accountId,
  };

  const lines = await prisma.accountingEntryLine.findMany({
    where,
    include: {
      entry: { select: { entryNumber: true, entryDate: true, description: true, status: true } },
    },
    orderBy: [{ entry: { entryDate: 'asc' } }, { entry: { entryNumber: 'asc' } }],
  });

  let balance = 0;
  return lines.map(l => {
    const val = Number(l.value);
    balance += l.debitCredit === 'DEBITO' ? val : -val;
    return { ...l, runningBalance: balance };
  });
}

// ── Balancete ─────────────────────────────────────────────────────────────────

export async function getTrialBalance(clientId: string, periodMonth?: number, periodYear?: number) {
  const where: Record<string, unknown> = {
    entry: {
      clientId,
      status: { not: 'ESTORNADO' },
      ...(periodMonth ? { periodMonth } : {}),
      ...(periodYear  ? { periodYear  } : {}),
    },
  };

  const lines = await prisma.accountingEntryLine.findMany({
    where,
    select: { accountId: true, debitCredit: true, value: true },
  });

  const accounts = await prisma.accountingPlan.findMany({
    where: { clientId, active: true },
    orderBy: { code: 'asc' },
  });

  const totals: Record<string, { debits: number; credits: number }> = {};
  for (const l of lines) {
    if (!totals[l.accountId]) totals[l.accountId] = { debits: 0, credits: 0 };
    if (l.debitCredit === 'DEBITO') totals[l.accountId].debits += Number(l.value);
    else totals[l.accountId].credits += Number(l.value);
  }

  return accounts
    .filter(a => totals[a.id])
    .map(a => {
      const t = totals[a.id];
      return {
        account: a,
        debits: t.debits,
        credits: t.credits,
        balance: t.debits - t.credits,
      };
    });
}
