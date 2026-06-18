import { prisma } from '../prisma/client.js';

// Gerador de EFD-REINF — eventos R-2010 (serviços tomados) e R-2020 (serviços prestados)

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return new Date().toISOString().split('T')[0];
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt.toISOString().split('T')[0];
}

function fmtDecimal(v: unknown): string {
  return Number(v ?? 0).toFixed(2);
}

export async function generateReinf(clientId: string, month: number, year: number): Promise<string> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
    include: { taxProfile: true },
  });

  // Serviços tomados (entradas de NFS-e)
  const tomados = await prisma.fiscalDocument.findMany({
    where: { clientId, periodMonth: month, periodYear: year, status: 'REGULAR', documentType: 'NFS_E', entryExit: 'ENTRADA' },
    orderBy: { issueDate: 'asc' },
  });

  // Serviços prestados (saídas de NFS-e)
  const prestados = await prisma.fiscalDocument.findMany({
    where: { clientId, periodMonth: month, periodYear: year, status: 'REGULAR', documentType: 'NFS_E', entryExit: 'SAIDA' },
    orderBy: { issueDate: 'asc' },
  });

  const periodo = `${year}-${String(month).padStart(2, '0')}`;
  const cnpj = client.cnpj.replace(/\D/g, '');
  const now = new Date().toISOString();
  const lines: string[] = [];

  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<Reinf xmlns="http://www.esocial.gov.br/schema/evt/evtTotal/v1_1_1">');

  // ── R-1000 — Informações do Contribuinte ──────────────────────────────────
  lines.push(`  <evtInfoContribuinte id="ID${cnpj}${periodo.replace('-', '')}01">`);
  lines.push(`    <ideEvento>`);
  lines.push(`      <indRetif>1</indRetif>`);
  lines.push(`      <perApur>${periodo}</perApur>`);
  lines.push(`      <tpAmb>2</tpAmb>`);
  lines.push(`      <aplicEmi>1</aplicEmi>`);
  lines.push(`      <verAplic>1.0</verAplic>`);
  lines.push(`    </ideEvento>`);
  lines.push(`    <ideContrib>`);
  lines.push(`      <tpInsc>1</tpInsc>`);
  lines.push(`      <nrInsc>${cnpj}</nrInsc>`);
  lines.push(`    </ideContrib>`);
  lines.push(`    <infoContribuinte>`);
  lines.push(`      <inclusao>`);
  lines.push(`        <idePeriodo>`);
  lines.push(`          <iniValid>${periodo}</iniValid>`);
  lines.push(`        </idePeriodo>`);
  lines.push(`        <infoCadastro>`);
  lines.push(`          <classTrib>${client.taxProfile?.companyType === 'SIMPLES_NACIONAL' ? '03' : '01'}</classTrib>`);
  lines.push(`          <indEscrituracao>1</indEscrituracao>`);
  lines.push(`          <indDesoneracao>N</indDesoneracao>`);
  lines.push(`          <indAcordoIsenMulta>N</indAcordoIsenMulta>`);
  lines.push(`          <indSitPJ>0</indSitPJ>`);
  lines.push(`        </infoCadastro>`);
  lines.push(`      </inclusao>`);
  lines.push(`    </infoContribuinte>`);
  lines.push(`  </evtInfoContribuinte>`);

  // ── R-2010 — Serviços Tomados ─────────────────────────────────────────────
  if (tomados.length > 0) {
    // Agrupa por prestador (cnpjIssuer)
    const byPrestador = tomados.reduce<Record<string, typeof tomados>>((acc, d) => {
      const k = d.cnpjIssuer?.replace(/\D/g, '') ?? 'desconhecido';
      if (!acc[k]) acc[k] = [];
      acc[k].push(d);
      return acc;
    }, {});

    let seq = 1;
    for (const [prestadorCnpj, docsPrestador] of Object.entries(byPrestador)) {
      const totalBruto = docsPrestador.reduce((s, d) => s + Number(d.totalProducts ?? 0), 0);
      const totalInss  = docsPrestador.reduce((s, d) => s + Number(d.valueInss ?? 0), 0);

      lines.push(`  <evtServTom id="ID${cnpj}${periodo.replace('-', '')}${String(seq).padStart(5, '0')}">`);
      lines.push(`    <ideEvento>`);
      lines.push(`      <indRetif>1</indRetif>`);
      lines.push(`      <perApur>${periodo}</perApur>`);
      lines.push(`      <tpAmb>2</tpAmb>`);
      lines.push(`      <aplicEmi>1</aplicEmi>`);
      lines.push(`      <verAplic>1.0</verAplic>`);
      lines.push(`    </ideEvento>`);
      lines.push(`    <ideContrib>`);
      lines.push(`      <tpInsc>1</tpInsc>`);
      lines.push(`      <nrInsc>${cnpj}</nrInsc>`);
      lines.push(`    </ideContrib>`);
      lines.push(`    <idePrestador>`);
      lines.push(`      <tpInscPrestador>1</tpInscPrestador>`);
      lines.push(`      <nrInscPrestador>${prestadorCnpj}</nrInscPrestador>`);
      lines.push(`    </idePrestador>`);
      lines.push(`    <infoServTom>`);
      lines.push(`      <vlrTotalBruto>${fmtDecimal(totalBruto)}</vlrTotalBruto>`);
      lines.push(`      <vlrTotalBaseInss>${fmtDecimal(totalBruto)}</vlrTotalBaseInss>`);
      lines.push(`      <vlrTotalRetPrinc>${fmtDecimal(totalInss)}</vlrTotalRetPrinc>`);
      lines.push(`      <vlrTotalRetAdic>0.00</vlrTotalRetAdic>`);
      lines.push(`      <vlrTotalNaoRet>0.00</vlrTotalNaoRet>`);

      for (const doc of docsPrestador) {
        lines.push(`      <nfs>`);
        lines.push(`        <serie>${doc.series ?? '1'}</serie>`);
        lines.push(`        <numDocto>${doc.documentNumber}</numDocto>`);
        lines.push(`        <dtEmissaoNF>${fmtDate(doc.issueDate)}</dtEmissaoNF>`);
        lines.push(`        <vlrBruto>${fmtDecimal(doc.totalProducts)}</vlrBruto>`);
        lines.push(`        <vlrBaseInss>${fmtDecimal(doc.totalProducts)}</vlrBaseInss>`);
        lines.push(`        <vlrRetencao>${fmtDecimal(doc.valueInss)}</vlrRetencao>`);
        lines.push(`        <vlrRetAdic>0.00</vlrRetAdic>`);
        lines.push(`        <vlrNaoRet>0.00</vlrNaoRet>`);
        lines.push(`        <indObra>N</indObra>`);
        lines.push(`        <indDedSusp>N</indDedSusp>`);
        lines.push(`      </nfs>`);
      }

      lines.push(`    </infoServTom>`);
      lines.push(`  </evtServTom>`);
      seq++;
    }
  }

  // ── R-2020 — Serviços Prestados ───────────────────────────────────────────
  if (prestados.length > 0) {
    const byTomador = prestados.reduce<Record<string, typeof prestados>>((acc, d) => {
      const k = d.cnpjRecipient?.replace(/\D/g, '') ?? 'desconhecido';
      if (!acc[k]) acc[k] = [];
      acc[k].push(d);
      return acc;
    }, {});

    let seq = 1;
    for (const [tomadorCnpj, docsT] of Object.entries(byTomador)) {
      const totalBruto = docsT.reduce((s, d) => s + Number(d.totalProducts ?? 0), 0);
      const totalInss  = docsT.reduce((s, d) => s + Number(d.valueInss ?? 0), 0);

      lines.push(`  <evtServPrest id="ID${cnpj}${periodo.replace('-', '')}P${String(seq).padStart(4, '0')}">`);
      lines.push(`    <ideEvento>`);
      lines.push(`      <indRetif>1</indRetif>`);
      lines.push(`      <perApur>${periodo}</perApur>`);
      lines.push(`      <tpAmb>2</tpAmb>`);
      lines.push(`      <aplicEmi>1</aplicEmi>`);
      lines.push(`      <verAplic>1.0</verAplic>`);
      lines.push(`    </ideEvento>`);
      lines.push(`    <ideContrib>`);
      lines.push(`      <tpInsc>1</tpInsc>`);
      lines.push(`      <nrInsc>${cnpj}</nrInsc>`);
      lines.push(`    </ideContrib>`);
      lines.push(`    <ideTomador>`);
      lines.push(`      <tpInscTomador>1</tpInscTomador>`);
      lines.push(`      <nrInscTomador>${tomadorCnpj}</nrInscTomador>`);
      lines.push(`    </ideTomador>`);
      lines.push(`    <infoServPrest>`);
      lines.push(`      <vlrTotalBruto>${fmtDecimal(totalBruto)}</vlrTotalBruto>`);
      lines.push(`      <vlrTotalRetPrinc>${fmtDecimal(totalInss)}</vlrTotalRetPrinc>`);
      lines.push(`      <vlrTotalNaoRet>0.00</vlrTotalNaoRet>`);

      for (const doc of docsT) {
        lines.push(`      <nfs>`);
        lines.push(`        <serie>${doc.series ?? '1'}</serie>`);
        lines.push(`        <numDocto>${doc.documentNumber}</numDocto>`);
        lines.push(`        <dtEmissaoNF>${fmtDate(doc.issueDate)}</dtEmissaoNF>`);
        lines.push(`        <vlrBruto>${fmtDecimal(doc.totalProducts)}</vlrBruto>`);
        lines.push(`        <vlrRetencao>${fmtDecimal(doc.valueInss)}</vlrRetencao>`);
        lines.push(`        <vlrNaoRet>0.00</vlrNaoRet>`);
        lines.push(`      </nfs>`);
      }

      lines.push(`    </infoServPrest>`);
      lines.push(`  </evtServPrest>`);
      seq++;
    }
  }

  lines.push('</Reinf>');
  return lines.join('\n');
}
