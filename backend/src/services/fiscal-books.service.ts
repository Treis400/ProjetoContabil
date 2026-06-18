import { Prisma } from '@prisma/client';
import { prisma } from '../prisma/client.js';

const D = (v: unknown) => new Prisma.Decimal(String(v ?? 0));
const toN = (v: unknown) => Number(v ?? 0);

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function fmtMoney(v: unknown) {
  return toN(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

function fmtDecimal(v: unknown, decimals = 2) {
  return toN(v).toFixed(decimals);
}

// ── Livro de Entradas ─────────────────────────────────────────────────────────

function buildEntradasContent(docs: Awaited<ReturnType<typeof fetchDocs>>, month: number, year: number): string {
  const lines: string[] = [];
  lines.push(`LIVRO DE ENTRADAS — ${MONTHS[month - 1].toUpperCase()}/${year}`);
  lines.push(`${'='.repeat(120)}`);
  lines.push(
    'Nº'.padEnd(6) +
    'Data'.padEnd(12) +
    'Tipo'.padEnd(8) +
    'Série'.padEnd(8) +
    'Número'.padEnd(12) +
    'Emitente'.padEnd(30) +
    'CNPJ'.padEnd(18) +
    'CFOP'.padEnd(8) +
    'Valor Total'.padEnd(15) +
    'BC ICMS'.padEnd(14) +
    'ICMS'.padEnd(12) +
    'IPI'.padEnd(10) +
    'PIS'.padEnd(10) +
    'COFINS'
  );
  lines.push('-'.repeat(180));

  let seq = 1;
  let totValue = 0, totBcIcms = 0, totIcms = 0, totIpi = 0, totPis = 0, totCofins = 0;

  for (const doc of docs) {
    const cfop = doc.items[0]?.cfop ?? '';
    const v   = toN(doc.totalDocument);
    const bc  = toN(doc.baseIcms);
    const ic  = toN(doc.valueIcms);
    const ip  = toN(doc.valueIpi);
    const ps  = toN(doc.valuePis);
    const co  = toN(doc.valueCofins);
    totValue += v; totBcIcms += bc; totIcms += ic; totIpi += ip; totPis += ps; totCofins += co;

    lines.push(
      String(seq++).padEnd(6) +
      new Date(doc.issueDate).toLocaleDateString('pt-BR').padEnd(12) +
      doc.documentType.replace('_', '-').padEnd(8) +
      (doc.series ?? '').padEnd(8) +
      doc.documentNumber.padEnd(12) +
      doc.nameIssuer.substring(0, 29).padEnd(30) +
      (doc.cnpjIssuer ?? '').padEnd(18) +
      cfop.padEnd(8) +
      fmtDecimal(v).padEnd(15) +
      fmtDecimal(bc).padEnd(14) +
      fmtDecimal(ic).padEnd(12) +
      fmtDecimal(ip).padEnd(10) +
      fmtDecimal(ps).padEnd(10) +
      fmtDecimal(co)
    );
  }

  lines.push('-'.repeat(180));
  lines.push(
    'TOTAIS'.padEnd(6 + 12 + 8 + 8 + 12 + 30 + 18 + 8) +
    fmtDecimal(totValue).padEnd(15) +
    fmtDecimal(totBcIcms).padEnd(14) +
    fmtDecimal(totIcms).padEnd(12) +
    fmtDecimal(totIpi).padEnd(10) +
    fmtDecimal(totPis).padEnd(10) +
    fmtDecimal(totCofins)
  );
  lines.push('');
  lines.push(`Total de documentos: ${docs.length}`);

  return lines.join('\n');
}

// ── Livro de Saídas ───────────────────────────────────────────────────────────

function buildSaidasContent(docs: Awaited<ReturnType<typeof fetchDocs>>, month: number, year: number): string {
  const lines: string[] = [];
  lines.push(`LIVRO DE SAÍDAS — ${MONTHS[month - 1].toUpperCase()}/${year}`);
  lines.push('='.repeat(120));
  lines.push(
    'Nº'.padEnd(6) +
    'Data'.padEnd(12) +
    'Tipo'.padEnd(8) +
    'Série'.padEnd(8) +
    'Número'.padEnd(12) +
    'Destinatário'.padEnd(30) +
    'CNPJ/CPF'.padEnd(18) +
    'UF'.padEnd(5) +
    'CFOP'.padEnd(8) +
    'Valor Total'.padEnd(15) +
    'BC ICMS'.padEnd(14) +
    'ICMS'.padEnd(12) +
    'IPI'.padEnd(10) +
    'PIS'.padEnd(10) +
    'COFINS'
  );
  lines.push('-'.repeat(185));

  let seq = 1;
  let totValue = 0, totBcIcms = 0, totIcms = 0, totIpi = 0, totPis = 0, totCofins = 0;

  for (const doc of docs) {
    const cfop = doc.items[0]?.cfop ?? '';
    const v   = toN(doc.totalDocument);
    const bc  = toN(doc.baseIcms);
    const ic  = toN(doc.valueIcms);
    const ip  = toN(doc.valueIpi);
    const ps  = toN(doc.valuePis);
    const co  = toN(doc.valueCofins);
    totValue += v; totBcIcms += bc; totIcms += ic; totIpi += ip; totPis += ps; totCofins += co;

    lines.push(
      String(seq++).padEnd(6) +
      new Date(doc.issueDate).toLocaleDateString('pt-BR').padEnd(12) +
      doc.documentType.replace('_', '-').padEnd(8) +
      (doc.series ?? '').padEnd(8) +
      doc.documentNumber.padEnd(12) +
      (doc.nameRecipient ?? '').substring(0, 29).padEnd(30) +
      (doc.cnpjRecipient ?? '').padEnd(18) +
      (doc.ufRecipient ?? '').padEnd(5) +
      cfop.padEnd(8) +
      fmtDecimal(v).padEnd(15) +
      fmtDecimal(bc).padEnd(14) +
      fmtDecimal(ic).padEnd(12) +
      fmtDecimal(ip).padEnd(10) +
      fmtDecimal(ps).padEnd(10) +
      fmtDecimal(co)
    );
  }

  lines.push('-'.repeat(185));
  lines.push(
    'TOTAIS'.padEnd(6 + 12 + 8 + 8 + 12 + 30 + 18 + 5 + 8) +
    fmtDecimal(totValue).padEnd(15) +
    fmtDecimal(totBcIcms).padEnd(14) +
    fmtDecimal(totIcms).padEnd(12) +
    fmtDecimal(totIpi).padEnd(10) +
    fmtDecimal(totPis).padEnd(10) +
    fmtDecimal(totCofins)
  );
  lines.push('');
  lines.push(`Total de documentos: ${docs.length}`);

  return lines.join('\n');
}

async function fetchDocs(clientId: string, entryExit: 'ENTRADA' | 'SAIDA', month: number, year: number) {
  return prisma.fiscalDocument.findMany({
    where: { clientId, entryExit, periodMonth: month, periodYear: year, status: 'REGULAR' },
    include: { items: { take: 1, orderBy: { itemNumber: 'asc' } } },
    orderBy: { issueDate: 'asc' },
  });
}

// ── Entry point ────────────────────────────────────────────────────────────────

export async function generateBook(
  clientId: string,
  bookType: string,
  month: number,
  year: number,
  userId?: string,
) {
  const entradas = await fetchDocs(clientId, 'ENTRADA', month, year);
  const saidas   = await fetchDocs(clientId, 'SAIDA', month, year);

  let fileContent = '';
  let totalEntries = 0;
  let totalSaidas  = 0;
  let totalValueEntries = 0;
  let totalValueSaidas  = 0;
  let totalIcms = 0, totalIpi = 0, totalPis = 0, totalCofins = 0, totalIss = 0;

  switch (bookType) {
    case 'ENTRADAS':
      fileContent = buildEntradasContent(entradas, month, year);
      totalEntries = entradas.length;
      totalValueEntries = entradas.reduce((s, d) => s + toN(d.totalDocument), 0);
      totalIcms    = entradas.reduce((s, d) => s + toN(d.valueIcms), 0);
      totalIpi     = entradas.reduce((s, d) => s + toN(d.valueIpi), 0);
      totalPis     = entradas.reduce((s, d) => s + toN(d.valuePis), 0);
      totalCofins  = entradas.reduce((s, d) => s + toN(d.valueCofins), 0);
      break;

    case 'SAIDAS':
      fileContent = buildSaidasContent(saidas, month, year);
      totalSaidas = saidas.length;
      totalValueSaidas = saidas.reduce((s, d) => s + toN(d.totalDocument), 0);
      totalIcms   = saidas.reduce((s, d) => s + toN(d.valueIcms), 0);
      totalIpi    = saidas.reduce((s, d) => s + toN(d.valueIpi), 0);
      totalPis    = saidas.reduce((s, d) => s + toN(d.valuePis), 0);
      totalCofins = saidas.reduce((s, d) => s + toN(d.valueCofins), 0);
      break;

    default:
      // Livro combinado de apuração
      fileContent =
        buildEntradasContent(entradas, month, year) + '\n\n' +
        buildSaidasContent(saidas, month, year);
      totalEntries = entradas.length;
      totalSaidas  = saidas.length;
      totalValueEntries = entradas.reduce((s, d) => s + toN(d.totalDocument), 0);
      totalValueSaidas  = saidas.reduce((s, d) => s + toN(d.totalDocument), 0);
      totalIcms   = [...entradas, ...saidas].reduce((s, d) => s + toN(d.valueIcms), 0);
      totalIpi    = [...entradas, ...saidas].reduce((s, d) => s + toN(d.valueIpi), 0);
      totalPis    = [...entradas, ...saidas].reduce((s, d) => s + toN(d.valuePis), 0);
      totalCofins = [...entradas, ...saidas].reduce((s, d) => s + toN(d.valueCofins), 0);
  }

  return prisma.fiscalBook.create({
    data: {
      clientId,
      bookType: bookType as never,
      periodMonth: month,
      periodYear: year,
      totalEntries,
      totalSaidas,
      totalValueEntries: D(totalValueEntries),
      totalValueSaidas:  D(totalValueSaidas),
      totalIcms:   D(totalIcms),
      totalIpi:    D(totalIpi),
      totalPis:    D(totalPis),
      totalCofins: D(totalCofins),
      totalIss:    D(totalIss),
      fileContent,
      createdById: userId,
    },
    include: { client: { select: { id: true, companyName: true } } },
  });
}

export async function listBooks(clientId: string, year?: number) {
  return prisma.fiscalBook.findMany({
    where: { clientId, ...(year ? { periodYear: year } : {}) },
    select: {
      id: true, bookType: true, periodMonth: true, periodYear: true,
      generatedAt: true, totalEntries: true, totalSaidas: true,
      totalValueEntries: true, totalValueSaidas: true,
      totalIcms: true, totalIpi: true, totalPis: true, totalCofins: true, totalIss: true,
    },
    orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }, { bookType: 'asc' }],
  });
}

export async function getBookContent(id: string) {
  return prisma.fiscalBook.findUniqueOrThrow({ where: { id } });
}

export async function deleteBook(id: string) {
  return prisma.fiscalBook.delete({ where: { id } });
}
