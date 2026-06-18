import { Prisma, TaxApurationType } from '@prisma/client';
import { prisma } from '../prisma/client.js';

const D = (v: number | string | Prisma.Decimal | null | undefined): Prisma.Decimal =>
  new Prisma.Decimal(String(v ?? 0));

const toN = (v: Prisma.Decimal | null | undefined): number =>
  v ? v.toNumber() : 0;

// ── ICMS ────────────────────────────────────────────────────────────────────

async function calcIcms(clientId: string, month: number, year: number, previousBalance: number, adjustments: { type: string; value: Prisma.Decimal }[]) {
  // Débitos: soma valueIcms das saídas
  const debitsAgg = await prisma.fiscalDocumentItem.aggregate({
    _sum: { valueIcms: true },
    where: {
      document: {
        clientId,
        entryExit: 'SAIDA',
        status: 'REGULAR',
        periodMonth: month,
        periodYear: year,
      },
    },
  });

  // Créditos: soma valueIcms das entradas
  const creditsAgg = await prisma.fiscalDocumentItem.aggregate({
    _sum: { valueIcms: true },
    where: {
      document: {
        clientId,
        entryExit: 'ENTRADA',
        status: 'REGULAR',
        periodMonth: month,
        periodYear: year,
      },
    },
  });

  // ST débitos (saídas)
  const stDebitsAgg = await prisma.fiscalDocumentItem.aggregate({
    _sum: { valueIcmsSt: true },
    where: { document: { clientId, entryExit: 'SAIDA', status: 'REGULAR', periodMonth: month, periodYear: year } },
  });

  // ST créditos (entradas)
  const stCreditsAgg = await prisma.fiscalDocumentItem.aggregate({
    _sum: { valueIcmsSt: true },
    where: { document: { clientId, entryExit: 'ENTRADA', status: 'REGULAR', periodMonth: month, periodYear: year } },
  });

  const totalDebits = toN(debitsAgg._sum.valueIcms);
  const totalCredits = toN(creditsAgg._sum.valueIcms);
  const totalStDebits = toN(stDebitsAgg._sum.valueIcmsSt);
  const totalStCredits = toN(stCreditsAgg._sum.valueIcmsSt);

  // Ajustes
  const adjCredits = adjustments
    .filter((a) => ['OUTROS_CREDITOS', 'INCENTIVO_FISCAL', 'ESTORNO_DEBITO'].includes(a.type))
    .reduce((s, a) => s + toN(a.value), 0);
  const adjDebits = adjustments
    .filter((a) => ['OUTROS_DEBITOS', 'ESTORNO_CREDITO', 'DEDUCAO'].includes(a.type))
    .reduce((s, a) => s + toN(a.value), 0);
  const totalAdjustments = adjCredits - adjDebits;

  // Saldo = (débitos) - (créditos + saldo anterior + ajustes crédito) + ajustes débito
  const balance = totalDebits - totalCredits - previousBalance + totalAdjustments;
  const taxDue = Math.max(0, balance);
  const nextBalance = balance < 0 ? Math.abs(balance) : 0;

  return {
    totalDebits, totalCredits, totalStDebits, totalStCredits,
    totalDifal: 0, totalPartilha: 0,
    totalAdjustments, previousBalance,
    balance, taxDue, nextBalance,
    pisRevenue: 0, pisDebits: 0, pisCredits: 0, pisNet: 0,
    cofinsRevenue: 0, cofinsDebits: 0, cofinsCredits: 0, cofinsNet: 0,
    issOwn: 0, issRetained: 0, issSubstitute: 0, issNet: 0,
    simplesRbcTotal: 0, simplesRbcAcum: 0, simplesAliquota: 0, simplesTotalDue: 0,
  };
}

// ── IPI ─────────────────────────────────────────────────────────────────────

async function calcIpi(clientId: string, month: number, year: number, previousBalance: number, adjustments: { type: string; value: Prisma.Decimal }[]) {
  const debitsAgg = await prisma.fiscalDocumentItem.aggregate({
    _sum: { valueIpi: true },
    where: { document: { clientId, entryExit: 'SAIDA', status: 'REGULAR', periodMonth: month, periodYear: year } },
  });
  const creditsAgg = await prisma.fiscalDocumentItem.aggregate({
    _sum: { valueIpi: true },
    where: { document: { clientId, entryExit: 'ENTRADA', status: 'REGULAR', periodMonth: month, periodYear: year } },
  });

  const totalDebits = toN(debitsAgg._sum.valueIpi);
  const totalCredits = toN(creditsAgg._sum.valueIpi);
  const adjTotal = adjustments
    .filter((a) => ['OUTROS_CREDITOS', 'ESTORNO_DEBITO'].includes(a.type))
    .reduce((s, a) => s + toN(a.value), 0)
    - adjustments.filter((a) => ['OUTROS_DEBITOS', 'ESTORNO_CREDITO'].includes(a.type))
      .reduce((s, a) => s + toN(a.value), 0);

  const balance = totalDebits - totalCredits - previousBalance + adjTotal;
  const taxDue = Math.max(0, balance);
  const nextBalance = balance < 0 ? Math.abs(balance) : 0;

  return {
    totalDebits, totalCredits, totalStDebits: 0, totalStCredits: 0,
    totalDifal: 0, totalPartilha: 0,
    totalAdjustments: adjTotal, previousBalance,
    balance, taxDue, nextBalance,
    pisRevenue: 0, pisDebits: 0, pisCredits: 0, pisNet: 0,
    cofinsRevenue: 0, cofinsDebits: 0, cofinsCredits: 0, cofinsNet: 0,
    issOwn: 0, issRetained: 0, issSubstitute: 0, issNet: 0,
    simplesRbcTotal: 0, simplesRbcAcum: 0, simplesAliquota: 0, simplesTotalDue: 0,
  };
}

// ── PIS / COFINS ─────────────────────────────────────────────────────────────

async function calcPisCofins(clientId: string, month: number, year: number, adjustments: { type: string; value: Prisma.Decimal }[]) {
  // Débitos: sobre saídas (faturamento)
  const pisDebitsAgg = await prisma.fiscalDocumentItem.aggregate({
    _sum: { valuePis: true },
    where: { document: { clientId, entryExit: 'SAIDA', status: 'REGULAR', periodMonth: month, periodYear: year } },
  });
  const cofinsDebitsAgg = await prisma.fiscalDocumentItem.aggregate({
    _sum: { valueCofins: true },
    where: { document: { clientId, entryExit: 'SAIDA', status: 'REGULAR', periodMonth: month, periodYear: year } },
  });

  // Créditos: sobre entradas com allowsCredit = true
  const pisCreditsAgg = await prisma.fiscalDocumentItem.aggregate({
    _sum: { valuePis: true },
    where: { allowsCredit: true, document: { clientId, entryExit: 'ENTRADA', status: 'REGULAR', periodMonth: month, periodYear: year } },
  });
  const cofinsCreditsAgg = await prisma.fiscalDocumentItem.aggregate({
    _sum: { valueCofins: true },
    where: { allowsCredit: true, document: { clientId, entryExit: 'ENTRADA', status: 'REGULAR', periodMonth: month, periodYear: year } },
  });

  // Base de cálculo (faturamento bruto saídas)
  const pisRevenueAgg = await prisma.fiscalDocument.aggregate({
    _sum: { totalProducts: true },
    where: { clientId, entryExit: 'SAIDA', status: 'REGULAR', periodMonth: month, periodYear: year },
  });

  const pisRevenue = toN(pisRevenueAgg._sum.totalProducts);
  const pisDebits = toN(pisDebitsAgg._sum.valuePis);
  const pisCredits = toN(pisCreditsAgg._sum.valuePis);
  const cofinsRevenue = pisRevenue;
  const cofinsDebits = toN(cofinsDebitsAgg._sum.valueCofins);
  const cofinsCredits = toN(cofinsCreditsAgg._sum.valueCofins);

  // Ajustes específicos de PIS/COFINS
  const adjPis = adjustments.reduce((s, a) => {
    const v = toN(a.value);
    return ['OUTROS_CREDITOS'].includes(a.type) ? s + v : ['OUTROS_DEBITOS'].includes(a.type) ? s - v : s;
  }, 0);

  const pisNet = Math.max(0, pisDebits - pisCredits + adjPis / 2);
  const cofinsNet = Math.max(0, cofinsDebits - cofinsCredits + adjPis / 2);

  return {
    totalDebits: pisDebits + cofinsDebits,
    totalCredits: pisCredits + cofinsCredits,
    totalStDebits: 0, totalStCredits: 0,
    totalDifal: 0, totalPartilha: 0,
    totalAdjustments: adjPis,
    previousBalance: 0,
    balance: pisNet + cofinsNet,
    taxDue: pisNet + cofinsNet,
    nextBalance: 0,
    pisRevenue, pisDebits, pisCredits, pisNet,
    cofinsRevenue, cofinsDebits, cofinsCredits, cofinsNet,
    issOwn: 0, issRetained: 0, issSubstitute: 0, issNet: 0,
    simplesRbcTotal: 0, simplesRbcAcum: 0, simplesAliquota: 0, simplesTotalDue: 0,
  };
}

// ── ISS ──────────────────────────────────────────────────────────────────────

async function calcIss(clientId: string, month: number, year: number) {
  // ISS próprio: saídas NFS-e
  const ownAgg = await prisma.fiscalDocument.aggregate({
    _sum: { valueIss: true },
    where: { clientId, entryExit: 'SAIDA', documentType: 'NFS_E', status: 'REGULAR', periodMonth: month, periodYear: year },
  });
  // ISS retido: entradas NFS-e
  const retainedAgg = await prisma.fiscalDocument.aggregate({
    _sum: { valueIssRetained: true },
    where: { clientId, entryExit: 'ENTRADA', documentType: 'NFS_E', status: 'REGULAR', periodMonth: month, periodYear: year },
  });

  const issOwn = toN(ownAgg._sum.valueIss);
  const issRetained = toN(retainedAgg._sum.valueIssRetained);
  const issNet = Math.max(0, issOwn - issRetained);

  return {
    totalDebits: issOwn,
    totalCredits: issRetained,
    totalStDebits: 0, totalStCredits: 0,
    totalDifal: 0, totalPartilha: 0,
    totalAdjustments: 0, previousBalance: 0,
    balance: issNet, taxDue: issNet, nextBalance: 0,
    pisRevenue: 0, pisDebits: 0, pisCredits: 0, pisNet: 0,
    cofinsRevenue: 0, cofinsDebits: 0, cofinsCredits: 0, cofinsNet: 0,
    issOwn, issRetained, issSubstitute: 0, issNet,
    simplesRbcTotal: 0, simplesRbcAcum: 0, simplesAliquota: 0, simplesTotalDue: 0,
  };
}

// ── Simples Nacional ──────────────────────────────────────────────────────────

// Tabelas de alíquotas do Simples Nacional (2024) simplificadas
// Retorna alíquota efetiva estimada baseada na RBC acumulada
function simplesAliquota(annex: string, rbcAcum: number): number {
  // Faixas do Anexo I (Comércio) — simplificadas para cálculo
  const faixas: Record<string, [number, number, number][]> = {
    'I':   [[180000,4.00,0],[360000,7.30,5940],[720000,9.50,13860],[1800000,10.70,22500],[3600000,14.30,87300],[4800000,19.00,378000]],
    'II':  [[180000,4.50,0],[360000,7.80,5940],[720000,10.00,13860],[1800000,11.20,22500],[3600000,14.70,85500],[4800000,30.00,720000]],
    'III': [[180000,6.00,0],[360000,11.20,9360],[720000,13.20,17940],[1800000,14.00,35640],[3600000,22.00,125640],[4800000,33.00,648000]],
    'IV':  [[180000,4.50,0],[360000,9.00,8100],[720000,10.20,12420],[1800000,14.00,39780],[3600000,22.00,183780],[4800000,33.00,828000]],
    'V':   [[180000,15.50,0],[360000,18.00,4500],[720000,19.50,9900],[1800000,20.50,17100],[3600000,23.00,62100],[4800000,30.50,540000]],
  };

  const faixasAnexo = faixas[annex] ?? faixas['I'];
  const rbc12 = rbcAcum;

  for (const [limite, nominal, deducao] of faixasAnexo) {
    if (rbc12 <= limite) {
      if (rbc12 === 0) return 0;
      return Math.max(0, ((rbc12 * (nominal / 100)) - deducao) / rbc12 * 100);
    }
  }
  // Última faixa
  const [, nominal, deducao] = faixasAnexo[faixasAnexo.length - 1];
  if (rbc12 === 0) return 0;
  return Math.max(0, ((rbc12 * (nominal / 100)) - deducao) / rbc12 * 100);
}

async function calcSimples(clientId: string, month: number, year: number, revenues: { annex: string; totalRevenue: number; revenueWithSt: number; revenueMonophasic: number; revenueIssRetained: number }[]) {
  // RBC acumulada dos últimos 12 meses
  const rbcAgg = await prisma.fiscalDocument.aggregate({
    _sum: { totalProducts: true },
    where: {
      clientId,
      entryExit: 'SAIDA',
      status: 'REGULAR',
      OR: [
        { periodYear: year - 1, periodMonth: { gte: month + 1 } },
        { periodYear: year, periodMonth: { lte: month } },
      ],
    },
  });
  const rbcAcum = toN(rbcAgg._sum.totalProducts);

  let simplesTotalDue = 0;
  const simplesRbcTotal = revenues.reduce((s, r) => s + r.totalRevenue, 0);

  const updatedRevenues = revenues.map((r) => {
    const aliq = simplesAliquota(r.annex, rbcAcum);
    const net = r.totalRevenue - r.revenueWithSt - r.revenueMonophasic - r.revenueIssRetained;
    const due = net * (aliq / 100);
    simplesTotalDue += due;
    return { ...r, netRevenue: net };
  });

  const aliqMedia = simplesRbcTotal > 0 ? (simplesTotalDue / simplesRbcTotal) * 100 : 0;

  return {
    result: {
      totalDebits: simplesRbcTotal,
      totalCredits: 0, totalStDebits: 0, totalStCredits: 0,
      totalDifal: 0, totalPartilha: 0, totalAdjustments: 0, previousBalance: 0,
      balance: simplesTotalDue, taxDue: simplesTotalDue, nextBalance: 0,
      pisRevenue: 0, pisDebits: 0, pisCredits: 0, pisNet: 0,
      cofinsRevenue: 0, cofinsDebits: 0, cofinsCredits: 0, cofinsNet: 0,
      issOwn: 0, issRetained: 0, issSubstitute: 0, issNet: 0,
      simplesRbcTotal, simplesRbcAcum: rbcAcum, simplesAliquota: aliqMedia, simplesTotalDue,
    },
    updatedRevenues,
  };
}

// ── Entry point ───────────────────────────────────────────────────────────────

export async function calculateApuration(apurationId: string): Promise<void> {
  const apuration = await prisma.taxApuration.findUniqueOrThrow({
    where: { id: apurationId },
    include: { adjustments: true, simplesRevenues: true },
  });

  const { clientId, taxType, periodMonth: month, periodYear: year } = apuration;

  // Saldo anterior: buscar apuração do período anterior encerrada
  let previousBalance = 0;
  const prev = await prisma.taxApuration.findFirst({
    where: {
      clientId,
      taxType,
      status: 'ENCERRADA',
      OR: [
        { periodYear: year, periodMonth: month - 1 },
        { periodYear: year - 1, periodMonth: 12, ...(month === 1 ? {} : { id: 'never' }) },
      ],
    },
    include: { result: true },
    orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
  });
  if (prev?.result) previousBalance = toN(prev.result.nextBalance);

  let resultData: Record<string, number>;
  let simplesRevUpdates: { annex: string; netRevenue: number }[] = [];

  switch (taxType as TaxApurationType) {
    case 'ICMS':
      resultData = await calcIcms(clientId, month, year, previousBalance, apuration.adjustments);
      break;
    case 'IPI':
      resultData = await calcIpi(clientId, month, year, previousBalance, apuration.adjustments);
      break;
    case 'PIS_COFINS':
      resultData = await calcPisCofins(clientId, month, year, apuration.adjustments);
      break;
    case 'ISS':
      resultData = await calcIss(clientId, month, year);
      break;
    case 'SIMPLES_NACIONAL': {
      const revenues = apuration.simplesRevenues.map((r) => ({
        annex: r.annex,
        totalRevenue: toN(r.totalRevenue),
        revenueWithSt: toN(r.revenueWithSt),
        revenueMonophasic: toN(r.revenueMonophasic),
        revenueIssRetained: toN(r.revenueIssRetained),
      }));
      const calc = await calcSimples(clientId, month, year, revenues);
      resultData = calc.result;
      simplesRevUpdates = calc.updatedRevenues;
      break;
    }
    default:
      throw new Error(`Tipo de apuração não suportado: ${taxType}`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.taxApurationResult.upsert({
      where: { apurationId },
      update: Object.fromEntries(Object.entries(resultData).map(([k, v]) => [k, D(v)])),
      create: {
        apurationId,
        ...Object.fromEntries(Object.entries(resultData).map(([k, v]) => [k, D(v)])),
      },
    });

    // Atualizar netRevenue das receitas Simples
    for (const rev of simplesRevUpdates) {
      await tx.taxApurationSimplesRevenue.updateMany({
        where: { apurationId, annex: rev.annex },
        data: { netRevenue: D(rev.netRevenue) },
      });
    }

    await tx.taxApuration.update({
      where: { id: apurationId },
      data: { status: 'CALCULADA', calculatedAt: new Date() },
    });
  });
}
