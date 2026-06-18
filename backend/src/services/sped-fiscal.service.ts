import { prisma } from '../prisma/client.js';

// Gerador de SPED Fiscal (EFD ICMS/IPI) — layout simplificado com blocos essenciais

function pad(value: string | number | null | undefined, size: number, padChar = ' ', left = false): string {
  const s = String(value ?? '');
  return left ? s.padStart(size, padChar) : s.padEnd(size, padChar);
}

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '';
  const dt = typeof d === 'string' ? new Date(d) : d;
  return `${String(dt.getDate()).padStart(2, '0')}${String(dt.getMonth() + 1).padStart(2, '0')}${dt.getFullYear()}`;
}

function fmtDecimal(v: unknown, decimals = 2): string {
  const n = Number(v ?? 0);
  return n.toFixed(decimals).replace('.', ',');
}

function record(tipo: string, campos: (string | number | null | undefined)[]): string {
  return `|${tipo}|${campos.map((c) => (c == null ? '' : String(c))).join('|')}|`;
}

export async function generateSpedFiscal(clientId: string, month: number, year: number): Promise<string> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
    include: { taxProfile: true },
  });

  const docs = await prisma.fiscalDocument.findMany({
    where: { clientId, periodMonth: month, periodYear: year, status: 'REGULAR' },
    include: { items: true },
    orderBy: [{ entryExit: 'asc' }, { issueDate: 'asc' }],
  });

  const entradas = docs.filter((d) => d.entryExit === 'ENTRADA');
  const saidas   = docs.filter((d) => d.entryExit === 'SAIDA');

  const lines: string[] = [];
  let totalLines = 0;

  function emit(line: string) {
    lines.push(line);
    totalLines++;
  }

  const dtIni = `01${String(month).padStart(2, '0')}${year}`;
  const dtFin = (() => {
    const last = new Date(year, month, 0).getDate();
    return `${last}${String(month).padStart(2, '0')}${year}`;
  })();

  // ── Bloco 0 ───────────────────────────────────────────────────────────────
  emit(record('0000', [
    '015', // versão leiaute
    'S',
    dtIni,
    dtFin,
    client.companyName,
    client.cnpj.replace(/\D/g, ''),
    '',    // uf (campo do endereço, não do taxProfile)
    client.stateRegistration ?? '',
    '',    // cod_mun
    '',    // suframa
    '0',   // ind_perfil (A, B, C)
    '1',   // ind_ativ
  ]));
  emit(record('0001', ['0']));
  emit(record('0990', [String(totalLines + 1)]));

  // ── Bloco C — Documentos fiscais ─────────────────────────────────────────
  const c0 = totalLines;
  emit(record('C001', ['0']));

  for (const doc of docs) {
    const cfop = doc.items[0]?.cfop ?? '';
    emit(record('C100', [
      doc.entryExit === 'ENTRADA' ? '0' : '1',
      '1',
      doc.cnpjIssuer?.replace(/\D/g, '') ?? '',
      doc.documentType === 'NF_E' ? '55' : '65',
      cfop,
      doc.series ?? '',
      doc.documentNumber,
      '',
      fmtDate(doc.issueDate),
      fmtDate(doc.entryExitDate ?? doc.issueDate),
      '1',
      fmtDecimal(doc.totalProducts),
      fmtDecimal(doc.totalDocument),
      fmtDecimal(doc.totalDiscount),
      fmtDecimal(doc.valueIcms),
      fmtDecimal(doc.valueIpi),
      fmtDecimal(doc.valuePis),
      fmtDecimal(doc.valueCofins),
      '',
      fmtDecimal(doc.totalFreight),
      fmtDecimal(doc.totalInsurance),
      fmtDecimal(doc.totalOther),
      doc.accessKey ?? '',
    ]));

    for (const item of doc.items) {
      emit(record('C170', [
        String(item.itemNumber),
        item.productCode ?? '',
        item.description,
        fmtDecimal(item.quantity, 4),
        item.unitOfMeasure ?? '',
        fmtDecimal(item.unitValue, 4),
        fmtDecimal(item.totalValue),
        item.cfop,
        item.ncm ?? '',
        fmtDecimal(item.discount),
        item.cstIcms ?? item.csosnIcms ?? '',
        fmtDecimal(item.baseIcms),
        fmtDecimal(item.icmsRate),
        fmtDecimal(item.valueIcms),
        fmtDecimal(item.baseIcmsSt),
        fmtDecimal(item.icmsStRate),
        fmtDecimal(item.valueIcmsSt),
        item.cstIpi ?? '',
        fmtDecimal(item.ipiRate),
        fmtDecimal(item.valueIpi),
        '',
        '',
      ]));
    }
  }

  const c9Lines = totalLines - c0;
  emit(record('C990', [String(c9Lines + 1)]));

  // ── Bloco D — Transportes (CT-e) ─────────────────────────────────────────
  const d0 = totalLines;
  emit(record('D001', ['1']));
  emit(record('D990', [String(totalLines - d0 + 1)]));

  // ── Bloco E — Apuração ────────────────────────────────────────────────────
  const e0 = totalLines;
  emit(record('E001', ['0']));
  emit(record('E100', [dtIni, dtFin]));

  const debitosIcms = docs.filter(d => d.entryExit === 'SAIDA').reduce((s, d) => s + Number(d.valueIcms ?? 0), 0);
  const creditosIcms = docs.filter(d => d.entryExit === 'ENTRADA').reduce((s, d) => s + Number(d.valueIcms ?? 0), 0);
  const saldo = debitosIcms - creditosIcms;

  emit(record('E110', [
    fmtDecimal(debitosIcms),
    '0,00', '0,00', '0,00', '0,00', '0,00',
    fmtDecimal(creditosIcms),
    '0,00', '0,00', '0,00', '0,00', '0,00',
    fmtDecimal(Math.max(0, saldo)),
    fmtDecimal(Math.max(0, -saldo)),
    fmtDecimal(Math.max(0, saldo)),
    '0,00',
  ]));

  emit(record('E990', [String(totalLines - e0 + 1)]));

  // ── Bloco G — CIAP (vazio) ────────────────────────────────────────────────
  const g0 = totalLines;
  emit(record('G001', ['1']));
  emit(record('G990', [String(totalLines - g0 + 1)]));

  // ── Bloco H — Inventário (vazio) ──────────────────────────────────────────
  const h0 = totalLines;
  emit(record('H001', ['1']));
  emit(record('H990', [String(totalLines - h0 + 1)]));

  // ── Bloco K — Controle de produção (vazio) ────────────────────────────────
  const k0 = totalLines;
  emit(record('K001', ['1']));
  emit(record('K990', [String(totalLines - k0 + 1)]));

  // ── Bloco 1 — Informações complementares (vazio) ─────────────────────────
  const b1 = totalLines;
  emit(record('1001', ['1']));
  emit(record('1990', [String(totalLines - b1 + 1)]));

  // ── Bloco 9 — Controle e encerramento ────────────────────────────────────
  emit(record('9001', ['0']));
  emit(record('9900', ['0000', '1']));
  emit(record('9900', ['0001', '1']));
  emit(record('9900', ['0990', '1']));
  emit(record('9900', ['C001', '1']));
  emit(record('9900', ['C990', '1']));
  emit(record('9900', ['D001', '1']));
  emit(record('9900', ['D990', '1']));
  emit(record('9900', ['E001', '1']));
  emit(record('9900', ['E990', '1']));
  emit(record('9900', ['G001', '1']));
  emit(record('9900', ['G990', '1']));
  emit(record('9900', ['H001', '1']));
  emit(record('9900', ['H990', '1']));
  emit(record('9900', ['K001', '1']));
  emit(record('9900', ['K990', '1']));
  emit(record('9900', ['1001', '1']));
  emit(record('9900', ['1990', '1']));
  emit(record('9900', ['9001', '1']));
  emit(record('9900', ['9900', String(lines.filter(l => l.startsWith('|9900|')).length + 1)]));
  emit(record('9900', ['9990', '1']));
  emit(record('9900', ['9999', '1']));
  emit(record('9990', [String(totalLines + 1)]));
  emit(record('9999', [String(totalLines + 1)]));

  return lines.join('\r\n');
}
