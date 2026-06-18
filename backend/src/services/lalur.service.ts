import { prisma } from '../prisma/client.js';
import type {
  LalurAdjustNature, LalurAdjustTiming, TaxRegimeCalc,
  LalurPartBControlType, LalurPartBMovType,
} from '@prisma/client';

// ── Tipos de Ajuste ────────────────────────────────────────────────────────────

export async function listAdjustTypes(clientId: string) {
  return prisma.lalurAdjustType.findMany({
    where: { clientId },
    orderBy: [{ nature: 'asc' }, { code: 'asc' }],
  });
}

export async function createAdjustType(clientId: string, data: {
  code: string; description: string; nature: LalurAdjustNature;
  timing?: LalurAdjustTiming; accountCode?: string; ecfRefCode?: string;
}) {
  return prisma.lalurAdjustType.create({ data: { clientId, ...data } });
}

export async function updateAdjustType(id: string, _clientId: string, data: Partial<{
  code: string; description: string; nature: LalurAdjustNature;
  timing: LalurAdjustTiming; accountCode: string; ecfRefCode: string; active: boolean;
}>) {
  return prisma.lalurAdjustType.update({ where: { id }, data });
}

export async function deleteAdjustType(id: string) {
  return prisma.lalurAdjustType.delete({ where: { id } });
}

// ── Regras de Integração Contábil ─────────────────────────────────────────────

export async function listAccountingRules(clientId: string) {
  return prisma.lalurAccountingRule.findMany({
    where: { clientId },
    include: { adjustType: true },
    orderBy: { accountCode: 'asc' },
  });
}

export async function createAccountingRule(clientId: string, data: {
  accountCode: string; nature: LalurAdjustNature; description: string; adjustTypeId?: string;
}) {
  return prisma.lalurAccountingRule.create({ data: { clientId, ...data } });
}

export async function updateAccountingRule(id: string, data: Partial<{
  accountCode: string; nature: LalurAdjustNature; description: string;
  adjustTypeId: string; active: boolean;
}>) {
  return prisma.lalurAccountingRule.update({ where: { id }, data });
}

export async function deleteAccountingRule(id: string) {
  return prisma.lalurAccountingRule.delete({ where: { id } });
}

// ── Período LALUR ─────────────────────────────────────────────────────────────

export async function listLalurPeriods(clientId: string) {
  return prisma.lalurPeriod.findMany({
    where: { clientId },
    orderBy: { periodYear: 'desc' },
    include: { irpjCsllCalc: true },
  });
}

export async function getLalurPeriod(clientId: string, periodYear: number) {
  return prisma.lalurPeriod.findUnique({
    where: { clientId_periodYear: { clientId, periodYear } },
    include: {
      partAEntries: {
        include: { adjustType: true },
        orderBy: { sequence: 'asc' },
      },
      partBBalances: {
        include: { movements: { orderBy: { movementDate: 'asc' } } },
        orderBy: { createdAt: 'asc' },
      },
      irpjCsllCalc: true,
      compensations: { orderBy: [{ type: 'asc' }, { originYear: 'asc' }] },
      lockedBy: { select: { name: true } },
    },
  });
}

export async function upsertLalurPeriod(clientId: string, periodYear: number, data: {
  taxRegime?: TaxRegimeCalc; accountingProfit?: number; notes?: string;
}) {
  const existing = await prisma.lalurPeriod.findUnique({
    where: { clientId_periodYear: { clientId, periodYear } },
  });
  if (existing) {
    return prisma.lalurPeriod.update({
      where: { id: existing.id },
      data: { ...data },
    });
  }
  return prisma.lalurPeriod.create({ data: { clientId, periodYear, ...data } });
}

export async function lockLalurPeriod(clientId: string, periodYear: number, userId?: string) {
  const period = await prisma.lalurPeriod.findUniqueOrThrow({
    where: { clientId_periodYear: { clientId, periodYear } },
  });
  await writeAuditLog({ clientId, lalurPeriodId: period.id, entity: 'LalurPeriod', entityId: period.id, action: 'LOCK', userId });
  return prisma.lalurPeriod.update({
    where: { id: period.id },
    data: { lockedAt: new Date(), lockedByUserId: userId ?? null },
  });
}

export async function unlockLalurPeriod(clientId: string, periodYear: number, userId?: string) {
  const period = await prisma.lalurPeriod.findUniqueOrThrow({
    where: { clientId_periodYear: { clientId, periodYear } },
  });
  await writeAuditLog({ clientId, lalurPeriodId: period.id, entity: 'LalurPeriod', entityId: period.id, action: 'UNLOCK', userId });
  return prisma.lalurPeriod.update({
    where: { id: period.id },
    data: { lockedAt: null, lockedByUserId: null },
  });
}

async function assertPeriodUnlocked(periodId: string) {
  const p = await prisma.lalurPeriod.findUniqueOrThrow({ where: { id: periodId } });
  if (p.lockedAt) throw new Error('Período encerrado. Reabra antes de efetuar alterações.');
}

// ── Parte A ───────────────────────────────────────────────────────────────────

export async function listPartAEntries(lalurPeriodId: string) {
  return prisma.lalurPartAEntry.findMany({
    where: { lalurPeriodId },
    include: { adjustType: true },
    orderBy: { sequence: 'asc' },
  });
}

export async function createPartAEntry(lalurPeriodId: string, data: {
  description: string; nature: LalurAdjustNature; timing?: LalurAdjustTiming;
  value: number; adjustTypeId?: string; accountCode?: string;
  documentRef?: string; notes?: string; periodMonth?: number;
}, userId?: string) {
  await assertPeriodUnlocked(lalurPeriodId);
  const lastEntry = await prisma.lalurPartAEntry.findFirst({
    where: { lalurPeriodId },
    orderBy: { sequence: 'desc' },
  });
  const sequence = (lastEntry?.sequence ?? 0) + 1;
  const entry = await prisma.lalurPartAEntry.create({ data: { lalurPeriodId, sequence, ...data } });
  await recalcLalurPeriod(lalurPeriodId);
  const period = await prisma.lalurPeriod.findUniqueOrThrow({ where: { id: lalurPeriodId } });
  await writeAuditLog({ clientId: period.clientId, lalurPeriodId, entity: 'LalurPartAEntry', entityId: entry.id, action: 'CREATE', after: JSON.stringify(data), userId });
  return entry;
}

export async function updatePartAEntry(id: string, data: Partial<{
  description: string; nature: LalurAdjustNature; timing: LalurAdjustTiming;
  value: number; adjustTypeId: string; accountCode: string;
  documentRef: string; notes: string; periodMonth: number;
}>, userId?: string) {
  const before = await prisma.lalurPartAEntry.findUniqueOrThrow({ where: { id } });
  await assertPeriodUnlocked(before.lalurPeriodId);
  const entry = await prisma.lalurPartAEntry.update({ where: { id }, data });
  await recalcLalurPeriod(entry.lalurPeriodId);
  const period = await prisma.lalurPeriod.findUniqueOrThrow({ where: { id: entry.lalurPeriodId } });
  await writeAuditLog({ clientId: period.clientId, lalurPeriodId: entry.lalurPeriodId, entity: 'LalurPartAEntry', entityId: id, action: 'UPDATE', before: JSON.stringify(before), after: JSON.stringify(data), userId });
  return entry;
}

export async function deletePartAEntry(id: string, userId?: string) {
  const entry = await prisma.lalurPartAEntry.findUniqueOrThrow({ where: { id } });
  await assertPeriodUnlocked(entry.lalurPeriodId);
  await prisma.lalurPartAEntry.delete({ where: { id } });
  await recalcLalurPeriod(entry.lalurPeriodId);
  const period = await prisma.lalurPeriod.findUniqueOrThrow({ where: { id: entry.lalurPeriodId } });
  await writeAuditLog({ clientId: period.clientId, lalurPeriodId: entry.lalurPeriodId, entity: 'LalurPartAEntry', entityId: id, action: 'DELETE', before: JSON.stringify(entry), userId });
}

async function recalcLalurPeriod(lalurPeriodId: string) {
  const period = await prisma.lalurPeriod.findUniqueOrThrow({ where: { id: lalurPeriodId } });
  const entries = await prisma.lalurPartAEntry.findMany({ where: { lalurPeriodId } });

  let totalAdditions = 0;
  let totalExclusions = 0;
  let totalCompensations = 0;

  for (const e of entries) {
    const v = Number(e.value);
    if (e.nature === 'ADICAO') totalAdditions += v;
    else if (e.nature === 'EXCLUSAO') totalExclusions += v;
    else if (e.nature === 'COMPENSACAO') totalCompensations += v;
  }

  const realProfit = Number(period.accountingProfit) + totalAdditions - totalExclusions - totalCompensations;

  await prisma.lalurPeriod.update({
    where: { id: lalurPeriodId },
    data: { totalAdditions, totalExclusions, totalCompensations, realProfit },
  });
}

// ── Parte B ───────────────────────────────────────────────────────────────────

export async function listPartBBalances(lalurPeriodId: string) {
  return prisma.lalurPartBBalance.findMany({
    where: { lalurPeriodId },
    include: { movements: { orderBy: { movementDate: 'asc' } } },
    orderBy: { createdAt: 'asc' },
  });
}

export async function createPartBBalance(lalurPeriodId: string, data: {
  description: string; type: string; controlType?: LalurPartBControlType;
  openingBalance?: number; additions?: number; realizations?: number;
  originDate?: string; originalValue?: number; partAEntryId?: string; notes?: string;
}, userId?: string) {
  await assertPeriodUnlocked(lalurPeriodId);
  const opening = data.openingBalance ?? 0;
  const additions = data.additions ?? 0;
  const realizations = data.realizations ?? 0;
  const closingBalance = opening + additions - realizations;
  const rec = await prisma.lalurPartBBalance.create({
    data: {
      lalurPeriodId,
      type: data.type as any,
      controlType: data.controlType ?? 'AJUSTE_TEMPORARIO',
      description: data.description,
      openingBalance: opening,
      additions,
      realizations,
      closingBalance,
      originDate: data.originDate ? new Date(data.originDate) : undefined,
      originalValue: data.originalValue,
      usedValue: realizations,
      partAEntryId: data.partAEntryId,
      notes: data.notes,
    },
  });
  if (additions > 0) {
    await prisma.lalurPartBMovement.create({
      data: {
        partBBalanceId: rec.id,
        type: 'INCLUSAO',
        value: additions,
        description: `Inclusão inicial — ${data.description}`,
        movementDate: data.originDate ? new Date(data.originDate) : new Date(),
        createdByUserId: userId ?? null,
      },
    });
  }
  const period = await prisma.lalurPeriod.findUniqueOrThrow({ where: { id: lalurPeriodId } });
  await writeAuditLog({ clientId: period.clientId, lalurPeriodId, entity: 'LalurPartBBalance', entityId: rec.id, action: 'CREATE', after: JSON.stringify(data), userId });
  return rec;
}

export async function updatePartBBalance(id: string, data: Partial<{
  description: string; controlType: LalurPartBControlType;
  openingBalance: number; additions: number; realizations: number; notes: string;
}>, userId?: string) {
  const current = await prisma.lalurPartBBalance.findUniqueOrThrow({ where: { id } });
  await assertPeriodUnlocked(current.lalurPeriodId);
  const opening = data.openingBalance ?? Number(current.openingBalance);
  const additions = data.additions ?? Number(current.additions);
  const realizations = data.realizations ?? Number(current.realizations);
  const closingBalance = opening + additions - realizations;
  const rec = await prisma.lalurPartBBalance.update({
    where: { id },
    data: { ...data, closingBalance, usedValue: realizations },
  });
  const period = await prisma.lalurPeriod.findUniqueOrThrow({ where: { id: current.lalurPeriodId } });
  await writeAuditLog({ clientId: period.clientId, lalurPeriodId: current.lalurPeriodId, entity: 'LalurPartBBalance', entityId: id, action: 'UPDATE', before: JSON.stringify(current), after: JSON.stringify(data), userId });
  return rec;
}

export async function deletePartBBalance(id: string, userId?: string) {
  const current = await prisma.lalurPartBBalance.findUniqueOrThrow({ where: { id } });
  await assertPeriodUnlocked(current.lalurPeriodId);
  await prisma.lalurPartBBalance.delete({ where: { id } });
  const period = await prisma.lalurPeriod.findUniqueOrThrow({ where: { id: current.lalurPeriodId } });
  await writeAuditLog({ clientId: period.clientId, lalurPeriodId: current.lalurPeriodId, entity: 'LalurPartBBalance', entityId: id, action: 'DELETE', before: JSON.stringify(current), userId });
}

// ── Movimentações da Parte B ──────────────────────────────────────────────────

export async function listPartBMovements(partBBalanceId: string) {
  return prisma.lalurPartBMovement.findMany({
    where: { partBBalanceId },
    include: { createdBy: { select: { name: true } } },
    orderBy: { movementDate: 'asc' },
  });
}

export async function createPartBMovement(partBBalanceId: string, data: {
  type: LalurPartBMovType; value: number; description: string;
  documentRef?: string; movementDate: string;
}, userId?: string) {
  const balance = await prisma.lalurPartBBalance.findUniqueOrThrow({ where: { id: partBBalanceId } });
  await assertPeriodUnlocked(balance.lalurPeriodId);

  const mov = await prisma.lalurPartBMovement.create({
    data: {
      partBBalanceId,
      type: data.type,
      value: data.value,
      description: data.description,
      documentRef: data.documentRef,
      movementDate: new Date(data.movementDate),
      createdByUserId: userId ?? null,
    },
  });

  // Atualiza saldo da Parte B conforme tipo de movimentação
  const opening = Number(balance.openingBalance);
  let additions = Number(balance.additions);
  let realizations = Number(balance.realizations);
  let usedValue = Number(balance.usedValue);

  if (data.type === 'INCLUSAO') additions += data.value;
  else if (data.type === 'UTILIZACAO' || data.type === 'BAIXA') {
    realizations += data.value;
    usedValue += data.value;
  }
  // TRANSFERENCIA não altera saldo próprio — seria tratada em outro balance

  await prisma.lalurPartBBalance.update({
    where: { id: partBBalanceId },
    data: { additions, realizations, usedValue, closingBalance: opening + additions - realizations },
  });

  return mov;
}

// ── Compensações ──────────────────────────────────────────────────────────────

export async function listCompensations(clientId: string, type?: string) {
  return prisma.lalurCompensation.findMany({
    where: { clientId, ...(type ? { type } : {}) },
    orderBy: [{ type: 'asc' }, { originYear: 'asc' }],
  });
}

export async function createCompensation(clientId: string, lalurPeriodId: string, data: {
  originYear: number; type: string; originalValue: number; notes?: string;
}) {
  return prisma.lalurCompensation.create({
    data: {
      clientId,
      lalurPeriodId,
      originYear: data.originYear,
      type: data.type,
      originalValue: data.originalValue,
      availableValue: data.originalValue,
      remainingValue: data.originalValue,
      notes: data.notes,
    },
  });
}

export async function calcCompensationLimit(clientId: string, periodYear: number) {
  const period = await prisma.lalurPeriod.findUnique({
    where: { clientId_periodYear: { clientId, periodYear } },
  });
  if (!period) return { irpjLimit: 0, csllLimit: 0, realProfit: 0, csllBase: 0, irpjAvailable: 0, irpjSuggested: 0, csllAvailable: 0, csllSuggested: 0, availableIrpj: [] as any[], availableCsll: [] as any[] };

  const realProfit = Number(period.realProfit) > 0 ? Number(period.realProfit) : 0;
  const irpjLimit = realProfit * 0.3;
  const csllBase = realProfit;
  const csllLimit = csllBase * 0.3;

  const availableIrpj = await prisma.lalurCompensation.findMany({
    where: { clientId, type: 'PREJUIZO_FISCAL', remainingValue: { gt: 0 } },
    orderBy: { originYear: 'asc' },
  });
  const availableCsll = await prisma.lalurCompensation.findMany({
    where: { clientId, type: 'BASE_NEGATIVA_CSLL', remainingValue: { gt: 0 } },
    orderBy: { originYear: 'asc' },
  });

  let totalIrpjAvailable = availableIrpj.reduce((acc, c) => acc + Number(c.remainingValue), 0);
  let totalCsllAvailable = availableCsll.reduce((acc, c) => acc + Number(c.remainingValue), 0);

  return {
    realProfit,
    irpjLimit,
    irpjAvailable: totalIrpjAvailable,
    irpjSuggested: Math.min(irpjLimit, totalIrpjAvailable),
    csllBase,
    csllLimit,
    csllAvailable: totalCsllAvailable,
    csllSuggested: Math.min(csllLimit, totalCsllAvailable),
    availableIrpj,
    availableCsll,
  };
}

export async function applyCompensation(clientId: string, periodYear: number, data: {
  irpjAmount: number; csllAmount: number;
}) {
  const period = await prisma.lalurPeriod.findUniqueOrThrow({
    where: { clientId_periodYear: { clientId, periodYear } },
  });
  const calc = await calcCompensationLimit(clientId, periodYear);

  if (data.irpjAmount > calc.irpjLimit) throw new Error(`Limite de compensação IRPJ excedido. Máximo: ${calc.irpjLimit.toFixed(2)}`);
  if (data.csllAmount > calc.csllLimit) throw new Error(`Limite de compensação CSLL excedido. Máximo: ${calc.csllLimit.toFixed(2)}`);

  let irpjLeft = data.irpjAmount;
  for (const comp of calc.availableIrpj) {
    if (irpjLeft <= 0) break;
    const use = Math.min(irpjLeft, Number(comp.remainingValue));
    await prisma.lalurCompensation.update({
      where: { id: comp.id },
      data: {
        usedValue: Number(comp.usedValue) + use,
        remainingValue: Number(comp.remainingValue) - use,
        usedInYear: periodYear,
      },
    });
    irpjLeft -= use;
  }

  let csllLeft = data.csllAmount;
  for (const comp of calc.availableCsll) {
    if (csllLeft <= 0) break;
    const use = Math.min(csllLeft, Number(comp.remainingValue));
    await prisma.lalurCompensation.update({
      where: { id: comp.id },
      data: {
        usedValue: Number(comp.usedValue) + use,
        remainingValue: Number(comp.remainingValue) - use,
        usedInYear: periodYear,
      },
    });
    csllLeft -= use;
  }

  // Cria entradas de compensação na Parte A
  if (data.irpjAmount > 0) {
    await createPartAEntry(period.id, {
      description: `Compensação de Prejuízo Fiscal — Ano ${periodYear}`,
      nature: 'COMPENSACAO',
      timing: 'PERMANENTE',
      value: data.irpjAmount,
      notes: 'Gerado automaticamente pelo módulo de compensações',
    });
  }

  return { applied: true, irpjApplied: data.irpjAmount, csllApplied: data.csllAmount };
}

// ── Integração com Contabilidade ──────────────────────────────────────────────

export async function importAccountingResult(clientId: string, periodYear: number, userId?: string) {
  const period = await prisma.lalurPeriod.findUniqueOrThrow({
    where: { clientId_periodYear: { clientId, periodYear } },
  });

  // Busca resultado contábil dos lançamentos
  const entries = await prisma.accountingEntry.findMany({
    where: {
      clientId,
      entryDate: {
        gte: new Date(`${periodYear}-01-01`),
        lte: new Date(`${periodYear}-12-31`),
      },
    },
    include: { lines: true },
  });

  // Busca mapa accountId → code
  const allAccountIds = [...new Set(entries.flatMap(e => e.lines.map(l => l.accountId)))];
  const accounts = await prisma.accountingPlan.findMany({ where: { id: { in: allAccountIds } } });
  const accountMap = new Map(accounts.map(a => [a.id, a.code]));

  let totalRevenue = 0;
  let totalExpense = 0;

  for (const entry of entries) {
    for (const line of entry.lines) {
      const acc = accountMap.get(line.accountId) ?? '';
      const val = Number(line.value);
      const isDebit = line.debitCredit === 'DEBITO';
      if (acc.startsWith('3')) totalRevenue += isDebit ? -val : val;
      if (acc.startsWith('4')) totalExpense += isDebit ? val : -val;
    }
  }

  const accountingProfit = totalRevenue - totalExpense;

  // Aplica regras automáticas de integração
  const rules = await prisma.lalurAccountingRule.findMany({ where: { clientId, active: true } });
  let adjustmentsCreated = 0;

  for (const rule of rules) {
    let ruleTotal = 0;
    for (const entry of entries) {
      for (const line of entry.lines) {
        const accCode = accountMap.get(line.accountId) ?? '';
        if (accCode === rule.accountCode) {
          const val = Number(line.value);
          ruleTotal += line.debitCredit === 'DEBITO' ? val : -val;
        }
      }
    }
    if (Math.abs(ruleTotal) > 0.01) {
      await createPartAEntry(period.id, {
        description: `[Auto] ${rule.description} (conta ${rule.accountCode})`,
        nature: rule.nature,
        timing: 'TEMPORARIA',
        value: Math.abs(ruleTotal),
        accountCode: rule.accountCode,
        notes: 'Ajuste automático por regra de integração contábil',
      }, userId);
      adjustmentsCreated++;
    }
  }

  await prisma.lalurPeriod.update({
    where: { id: period.id },
    data: { accountingProfit },
  });

  await prisma.lalurAccountingImport.create({
    data: {
      clientId,
      lalurPeriodId: period.id,
      accountingProfit,
      adjustmentsCount: adjustmentsCreated,
      notes: `Receitas: ${totalRevenue.toFixed(2)}, Despesas: ${totalExpense.toFixed(2)}`,
      importedByUserId: userId ?? null,
    },
  });

  await recalcLalurPeriod(period.id);
  await writeAuditLog({ clientId, lalurPeriodId: period.id, entity: 'LalurPeriod', entityId: period.id, action: 'IMPORT', after: JSON.stringify({ accountingProfit, adjustmentsCreated }), userId });

  return { accountingProfit, adjustmentsCreated };
}

export async function listAccountingImports(lalurPeriodId: string) {
  return prisma.lalurAccountingImport.findMany({
    where: { lalurPeriodId },
    include: { importedBy: { select: { name: true } } },
    orderBy: { importedAt: 'desc' },
  });
}

// ── IRPJ / CSLL ───────────────────────────────────────────────────────────────

export async function calcIrpjCsll(lalurPeriodId: string, data: {
  irpjRate?: number; irpjSurchargeRate?: number;
  csllRate?: number; irpjIncentives?: number; csllIncentives?: number;
  irpjMonthlyEstimate?: number; csllMonthlyEstimate?: number; notes?: string;
}) {
  const period = await prisma.lalurPeriod.findUniqueOrThrow({ where: { id: lalurPeriodId } });
  const base = Number(period.realProfit) < 0 ? 0 : Number(period.realProfit);

  const irpjRate = data.irpjRate ?? 15;
  const csllRate = data.csllRate ?? 9;
  const surchargeRate = data.irpjSurchargeRate ?? 10;
  const surchargeThreshold = 240000;

  const irpjBase = base;
  const csllBase = base;
  const irpjValue = irpjBase * (irpjRate / 100);
  const surchargeBase = Math.max(0, irpjBase - surchargeThreshold);
  const surchargeValue = surchargeBase * (surchargeRate / 100);
  const irpjTotal = irpjValue + surchargeValue;
  const csllValue = csllBase * (csllRate / 100);
  const irpjIncentives = data.irpjIncentives ?? 0;
  const csllIncentives = data.csllIncentives ?? 0;
  const irpjNet = Math.max(0, irpjTotal - irpjIncentives);
  const csllNet = Math.max(0, csllValue - csllIncentives);

  return prisma.irpjCsllCalc.upsert({
    where: { lalurPeriodId },
    update: {
      irpjBase, csllBase, irpjRate, irpjValue,
      irpjSurchargeBase: surchargeBase, irpjSurchargeRate: surchargeRate, irpjSurchargeValue: surchargeValue,
      irpjTotal, csllRate, csllValue, irpjIncentives, csllIncentives,
      irpjNet, csllNet,
      irpjMonthlyEstimate: data.irpjMonthlyEstimate ?? 0,
      csllMonthlyEstimate: data.csllMonthlyEstimate ?? 0,
      status: 'CALCULADO', calculatedAt: new Date(), notes: data.notes,
    },
    create: {
      lalurPeriodId, taxRegime: period.taxRegime,
      irpjBase, csllBase, irpjRate, irpjValue,
      irpjSurchargeBase: surchargeBase, irpjSurchargeRate: surchargeRate, irpjSurchargeValue: surchargeValue,
      irpjTotal, csllRate, csllValue, irpjIncentives, csllIncentives,
      irpjNet, csllNet,
      irpjMonthlyEstimate: data.irpjMonthlyEstimate ?? 0,
      csllMonthlyEstimate: data.csllMonthlyEstimate ?? 0,
      status: 'CALCULADO', calculatedAt: new Date(), notes: data.notes,
    },
  });
}

// ── ECF ───────────────────────────────────────────────────────────────────────

export async function generateEcf(clientId: string, periodYear: number) {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
    include: { taxProfile: true },
  });

  const lalurPeriod = await prisma.lalurPeriod.findUnique({
    where: { clientId_periodYear: { clientId, periodYear } },
    include: {
      partAEntries: { include: { adjustType: true }, orderBy: { sequence: 'asc' } },
      partBBalances: true,
      irpjCsllCalc: true,
      compensations: true,
    },
  });

  const lines: string[] = [];
  const dt = new Date();
  const dtStr = `${dt.getFullYear()}${String(dt.getMonth() + 1).padStart(2, '0')}${String(dt.getDate()).padStart(2, '0')}`;
  const cnpj = client.cnpj.replace(/\D/g, '');

  lines.push(`|0000|ECF|${periodYear}0101|${periodYear}1231|${cnpj}|${client.companyName}||||||${dtStr}|`);
  lines.push(`|0001|1|`);

  if (lalurPeriod) {
    const adicoes = lalurPeriod.partAEntries.filter(e => e.nature === 'ADICAO');
    const exclusoes = lalurPeriod.partAEntries.filter(e => e.nature === 'EXCLUSAO');
    const compensacoes = lalurPeriod.partAEntries.filter(e => e.nature === 'COMPENSACAO');

    // Bloco M — Lucro Real (IRPJ)
    lines.push(`|M001|1|`);
    lines.push(`|M300|${Number(lalurPeriod.accountingProfit).toFixed(2)}|`);
    for (const e of adicoes) {
      lines.push(`|M300|${e.sequence.toString().padStart(3, '0')}|${(e as any).adjustType?.ecfRefCode ?? ''}|${e.description}|${Number(e.value).toFixed(2)}|`);
    }
    lines.push(`|M305|${Number(lalurPeriod.totalAdditions).toFixed(2)}|`);
    for (const e of exclusoes) {
      lines.push(`|M350|${e.sequence.toString().padStart(3, '0')}|${(e as any).adjustType?.ecfRefCode ?? ''}|${e.description}|${Number(e.value).toFixed(2)}|`);
    }
    lines.push(`|M355|${Number(lalurPeriod.totalExclusions).toFixed(2)}|`);
    for (const e of compensacoes) {
      lines.push(`|M380|${e.description}|${Number(e.value).toFixed(2)}|`);
    }
    lines.push(`|M390|${Number(lalurPeriod.realProfit).toFixed(2)}|`);

    // Bloco M410 — Parte B
    for (const b of lalurPeriod.partBBalances) {
      lines.push(`|M410|${b.description}|${b.controlType}|${Number(b.openingBalance).toFixed(2)}|${Number(b.additions).toFixed(2)}|${Number(b.realizations).toFixed(2)}|${Number(b.closingBalance).toFixed(2)}|`);
    }

    // Bloco M500 — IRPJ / Bloco N — CSLL
    if (lalurPeriod.irpjCsllCalc) {
      const c = lalurPeriod.irpjCsllCalc;
      lines.push(`|M500|${Number(c.irpjBase).toFixed(2)}|${Number(c.irpjRate).toFixed(4)}|${Number(c.irpjValue).toFixed(2)}|${Number(c.irpjSurchargeBase).toFixed(2)}|${Number(c.irpjSurchargeRate).toFixed(4)}|${Number(c.irpjSurchargeValue).toFixed(2)}|${Number(c.irpjIncentives).toFixed(2)}|${Number(c.irpjNet).toFixed(2)}|`);
      lines.push(`|M510|${Number(c.csllBase).toFixed(2)}|${Number(c.csllRate).toFixed(4)}|${Number(c.csllValue).toFixed(2)}|${Number(c.csllIncentives).toFixed(2)}|${Number(c.csllNet).toFixed(2)}|`);
    }
    lines.push(`|M990|${lines.filter(l => l.startsWith('|M')).length + 1}|`);

    // Bloco K — Saldos Parte B
    lines.push(`|K001|1|`);
    for (const b of lalurPeriod.partBBalances) {
      lines.push(`|K100|${b.controlType}|${b.description}|${Number(b.openingBalance).toFixed(2)}|${Number(b.closingBalance).toFixed(2)}|`);
    }
    lines.push(`|K990|${lines.filter(l => l.startsWith('|K')).length + 1}|`);
  }

  // Bloco 9 — Encerramento
  lines.push(`|9001|0|`);
  lines.push(`|9990|${lines.length + 2}|`);
  lines.push(`|9999|${lines.length + 1}|`);

  const fileContent = lines.join('\r\n');
  const fileName = `ECF_${cnpj}_${periodYear}.txt`;

  return prisma.ecfFile.upsert({
    where: { clientId_periodYear: { clientId, periodYear } },
    update: { fileContent, fileName, status: 'GERADA', generatedAt: new Date(), errorMessage: null },
    create: { clientId, periodYear, fileContent, fileName, status: 'GERADA', generatedAt: new Date() },
  });
}

export async function listEcfFiles(clientId: string) {
  return prisma.ecfFile.findMany({ where: { clientId }, orderBy: { periodYear: 'desc' } });
}

// ── Audit Log ─────────────────────────────────────────────────────────────────

async function writeAuditLog(data: {
  clientId: string; lalurPeriodId?: string; entity: string; entityId?: string;
  action: string; before?: string; after?: string; userId?: string;
}) {
  return prisma.lalurAuditLog.create({ data: { ...data, action: data.action as any } });
}

export async function listAuditLogs(clientId: string, lalurPeriodId?: string) {
  return prisma.lalurAuditLog.findMany({
    where: { clientId, ...(lalurPeriodId ? { lalurPeriodId } : {}) },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
}
