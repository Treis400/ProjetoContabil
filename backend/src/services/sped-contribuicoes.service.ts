import { prisma } from '../prisma/client.js';

// Gerador de SPED Contribuições (EFD PIS/COFINS) — blocos essenciais

function record(tipo: string, campos: (string | number | null | undefined)[]): string {
  return `|${tipo}|${campos.map((c) => (c == null ? '' : String(c))).join('|')}|`;
}

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '';
  const dt = typeof d === 'string' ? new Date(d) : d;
  return `${String(dt.getDate()).padStart(2, '0')}${String(dt.getMonth() + 1).padStart(2, '0')}${dt.getFullYear()}`;
}

function fmtDecimal(v: unknown, decimals = 2): string {
  return Number(v ?? 0).toFixed(decimals).replace('.', ',');
}

export async function generateSpedContribuicoes(clientId: string, month: number, year: number): Promise<string> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
    include: { taxProfile: true },
  });

  const docs = await prisma.fiscalDocument.findMany({
    where: { clientId, periodMonth: month, periodYear: year, status: 'REGULAR' },
    include: { items: true },
    orderBy: [{ entryExit: 'asc' }, { issueDate: 'asc' }],
  });

  const lines: string[] = [];
  let total = 0;
  const emit = (l: string) => { lines.push(l); total++; };

  const dtIni = `01${String(month).padStart(2, '0')}${year}`;
  const dtFin = (() => {
    const last = new Date(year, month, 0).getDate();
    return `${last}${String(month).padStart(2, '0')}${year}`;
  })();

  const pisCofinsRegime = client.taxProfile?.pisCofinsRegime ?? 'CUMULATIVO';
  const indAprop = pisCofinsRegime === 'NAO_CUMULATIVO' ? '1' : '0';

  // ── Bloco 0 ────────────────────────────────────────────────────────────────
  emit(record('0000', [
    '006',
    '',
    dtIni,
    dtFin,
    client.companyName,
    client.cnpj.replace(/\D/g, ''),
    '',    // uf
    client.stateRegistration ?? '',
    '',
    '',
    indAprop,
    pisCofinsRegime === 'NAO_CUMULATIVO' ? '2' : '1',
    '0',
  ]));
  emit(record('0001', ['0']));
  emit(record('0990', ['3']));

  // ── Bloco A — Serviços (NFS-e) ────────────────────────────────────────────
  const a0 = total;
  emit(record('A001', ['0']));

  const nfse = docs.filter((d) => d.documentType === 'NFS_E');
  for (const doc of nfse) {
    emit(record('A100', [
      doc.entryExit === 'ENTRADA' ? '0' : '1',
      doc.cnpjIssuer?.replace(/\D/g, '') ?? '',
      fmtDate(doc.issueDate),
      doc.documentNumber,
      fmtDecimal(doc.totalProducts),
      fmtDecimal(doc.totalDiscount),
      fmtDecimal(doc.totalDocument),
      '',
      '',
    ]));

    const pisCst  = doc.items[0]?.cstPisCofins ?? '99';
    const valuePis    = Number(doc.valuePis ?? 0);
    const valueCofins = Number(doc.valueCofins ?? 0);
    const base = Number(doc.totalProducts ?? 0) - Number(doc.totalDiscount ?? 0);

    emit(record('A170', [
      '1',
      doc.items[0]?.description ?? '',
      fmtDecimal(doc.totalProducts),
      pisCst,
      fmtDecimal(base),
      fmtDecimal(valuePis > 0 && base > 0 ? (valuePis / base) * 100 : 0, 4),
      fmtDecimal(valuePis),
      fmtDecimal(base),
      fmtDecimal(valueCofins > 0 && base > 0 ? (valueCofins / base) * 100 : 0, 4),
      fmtDecimal(valueCofins),
    ]));
  }

  emit(record('A990', [String(total - a0 + 1)]));

  // ── Bloco C — NF-e ────────────────────────────────────────────────────────
  const c0 = total;
  emit(record('C001', ['0']));

  const nfe = docs.filter((d) => ['NF_E', 'NFC_E'].includes(d.documentType));
  for (const doc of nfe) {
    emit(record('C100', [
      doc.entryExit === 'ENTRADA' ? '0' : '1',
      '1',
      doc.cnpjIssuer?.replace(/\D/g, '') ?? '',
      doc.documentType === 'NF_E' ? '55' : '65',
      doc.items[0]?.cfop ?? '',
      doc.series ?? '',
      doc.documentNumber,
      '',
      fmtDate(doc.issueDate),
      fmtDate(doc.entryExitDate ?? doc.issueDate),
      '1',
      fmtDecimal(doc.totalProducts),
      fmtDecimal(doc.totalDocument),
      fmtDecimal(doc.totalDiscount),
      doc.accessKey ?? '',
    ]));

    for (const item of doc.items) {
      const pisCst = item.cstPisCofins ?? '99';
      const base = Number(item.totalValue ?? 0) - Number(item.discount ?? 0);
      emit(record('C170', [
        String(item.itemNumber),
        item.productCode ?? '',
        item.description,
        fmtDecimal(item.quantity, 4),
        item.unitOfMeasure ?? '',
        fmtDecimal(item.unitValue, 4),
        fmtDecimal(item.totalValue),
        item.cfop,
        fmtDecimal(item.discount),
        item.ncm ?? '',
        pisCst,
        fmtDecimal(base),
        fmtDecimal(Number(item.pisRate ?? 0), 4),
        fmtDecimal(item.valuePis),
        fmtDecimal(base),
        fmtDecimal(Number(item.cofinsRate ?? 0), 4),
        fmtDecimal(item.valueCofins),
      ]));
    }
  }

  emit(record('C990', [String(total - c0 + 1)]));

  // ── Bloco D — CT-e ────────────────────────────────────────────────────────
  const d0 = total;
  emit(record('D001', ['1']));
  emit(record('D990', [String(total - d0 + 1)]));

  // ── Bloco F — Demais documentos (vazio) ──────────────────────────────────
  const f0 = total;
  emit(record('F001', ['1']));
  emit(record('F990', [String(total - f0 + 1)]));

  // ── Bloco M — Apuração PIS/COFINS ────────────────────────────────────────
  const m0 = total;
  emit(record('M001', ['0']));

  const totPisD = docs.filter(d => d.entryExit === 'SAIDA').reduce((s, d) => s + Number(d.valuePis ?? 0), 0);
  const totPisC = docs.filter(d => d.entryExit === 'ENTRADA' && d.items.some(i => i.allowsCredit)).reduce((s, d) => s + Number(d.valuePis ?? 0), 0);
  const totCofD = docs.filter(d => d.entryExit === 'SAIDA').reduce((s, d) => s + Number(d.valueCofins ?? 0), 0);
  const totCofC = docs.filter(d => d.entryExit === 'ENTRADA' && d.items.some(i => i.allowsCredit)).reduce((s, d) => s + Number(d.valueCofins ?? 0), 0);

  emit(record('M200', [
    fmtDecimal(totPisD),
    '0,00', '0,00', '0,00', '0,00', '0,00',
    fmtDecimal(totPisC),
    '0,00', '0,00', '0,00', '0,00',
    fmtDecimal(Math.max(0, totPisD - totPisC)),
    fmtDecimal(Math.max(0, totPisC - totPisD)),
    fmtDecimal(Math.max(0, totPisD - totPisC)),
    '0,00',
  ]));

  emit(record('M600', [
    fmtDecimal(totCofD),
    '0,00', '0,00', '0,00', '0,00', '0,00',
    fmtDecimal(totCofC),
    '0,00', '0,00', '0,00', '0,00',
    fmtDecimal(Math.max(0, totCofD - totCofC)),
    fmtDecimal(Math.max(0, totCofC - totCofD)),
    fmtDecimal(Math.max(0, totCofD - totCofC)),
    '0,00',
  ]));

  emit(record('M990', [String(total - m0 + 1)]));

  // ── Bloco P — CPRB (vazio) ────────────────────────────────────────────────
  const p0 = total;
  emit(record('P001', ['1']));
  emit(record('P990', [String(total - p0 + 1)]));

  // ── Bloco 1 — Complementares (vazio) ─────────────────────────────────────
  const b1 = total;
  emit(record('1001', ['1']));
  emit(record('1990', [String(total - b1 + 1)]));

  // ── Bloco 9 ───────────────────────────────────────────────────────────────
  emit(record('9001', ['0']));
  emit(record('9900', ['0000', '1']));
  emit(record('9900', ['0001', '1']));
  emit(record('9900', ['0990', '1']));
  emit(record('9900', ['A001', '1']));
  emit(record('9900', ['A990', '1']));
  emit(record('9900', ['C001', '1']));
  emit(record('9900', ['C990', '1']));
  emit(record('9900', ['D001', '1']));
  emit(record('9900', ['D990', '1']));
  emit(record('9900', ['F001', '1']));
  emit(record('9900', ['F990', '1']));
  emit(record('9900', ['M001', '1']));
  emit(record('9900', ['M990', '1']));
  emit(record('9900', ['P001', '1']));
  emit(record('9900', ['P990', '1']));
  emit(record('9900', ['1001', '1']));
  emit(record('9900', ['1990', '1']));
  emit(record('9900', ['9001', '1']));
  const n9900 = lines.filter((l) => l.startsWith('|9900|')).length;
  emit(record('9900', ['9900', String(n9900 + 1)]));
  emit(record('9900', ['9990', '1']));
  emit(record('9900', ['9999', '1']));
  emit(record('9990', [String(total + 1)]));
  emit(record('9999', [String(total + 1)]));

  return lines.join('\r\n');
}
