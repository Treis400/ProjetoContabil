import { XMLParser } from 'fast-xml-parser';
import type { FiscalDocumentType } from '@prisma/client';

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

type ParsedItem = {
  itemNumber: number;
  productCode?: string;
  description: string;
  ncm?: string;
  cfop: string;
  unitOfMeasure?: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
  discount: number;
  cstIcms?: string;
  csosnIcms?: string;
  cstIpi?: string;
  cstPisCofins?: string;
  baseIcms: number;
  icmsRate: number;
  valueIcms: number;
  baseIcmsSt: number;
  icmsStRate: number;
  valueIcmsSt: number;
  ipiRate: number;
  valueIpi: number;
  pisRate: number;
  valuePis: number;
  cofinsRate: number;
  valueCofins: number;
  allowsCredit: boolean;
};

type ParsedDocument = {
  documentType: FiscalDocumentType;
  documentNumber: string;
  series?: string;
  accessKey?: string;
  issueDate: Date;
  entryExitDate?: Date;
  cnpjIssuer: string;
  nameIssuer: string;
  stateRegIssuer?: string;
  ufIssuer?: string;
  cnpjRecipient?: string;
  nameRecipient?: string;
  stateRegRecipient?: string;
  ufRecipient?: string;
  totalProducts: number;
  totalDocument: number;
  totalFreight: number;
  totalInsurance: number;
  totalDiscount: number;
  totalOther: number;
  baseIcms: number;
  valueIcms: number;
  baseIcmsSt: number;
  valueIcmsSt: number;
  valueIpi: number;
  valuePis: number;
  valueCofins: number;
  baseIss: number;
  valueIss: number;
  valueIssRetained: number;
  valueInss: number;
  valueIrrf: number;
  valueCsll: number;
  items: ParsedItem[];
};

function num(val: unknown): number {
  return parseFloat(String(val ?? '0')) || 0;
}

function str(val: unknown): string {
  return String(val ?? '').trim();
}

function parseDate(val: unknown): Date {
  const s = str(val);
  return new Date(s.includes('T') ? s : `${s}T00:00:00`);
}

export function parseNFeXml(xmlContent: string): ParsedDocument {
  const json = parser.parse(xmlContent);

  // Detectar tipo do documento pela tag raiz
  const nfeProc = json.nfeProc ?? json.NFe;
  const nfe = nfeProc?.NFe ?? nfeProc;
  const infNFe = nfe?.infNFe;

  if (!infNFe) {
    throw new Error('XML inválido: estrutura NF-e não reconhecida.');
  }

  const ide = infNFe.ide ?? {};
  const emit = infNFe.emit ?? {};
  const dest = infNFe.dest ?? {};
  const total = infNFe.total?.ICMSTot ?? {};
  const cobr = infNFe.cobr ?? {};

  const mod = str(ide.mod);
  const documentType: FiscalDocumentType = mod === '65' ? 'NFC_E' : 'NF_E';

  // Chave de acesso: pode estar no atributo Id do infNFe
  const infNFeId: string = str(infNFe['@_Id'] ?? '').replace('NFe', '');

  const rawItems = Array.isArray(infNFe.det) ? infNFe.det : infNFe.det ? [infNFe.det] : [];

  const items: ParsedItem[] = rawItems.map((det: Record<string, unknown>, idx: number) => {
    const prod = (det.prod ?? {}) as Record<string, unknown>;
    const imposto = (det.imposto ?? {}) as Record<string, unknown>;

    // ICMS (pode ser vários grupos: ICMS00, ICMS20, etc.)
    const icmsGroup = (imposto.ICMS ?? {}) as Record<string, unknown>;
    const icmsData = Object.values(icmsGroup)[0] as Record<string, unknown> ?? {};

    // IPI
    const ipiData = ((imposto.IPI ?? {}) as Record<string, unknown>).IPITrib as Record<string, unknown> ?? {};

    // PIS
    const pisData = Object.values((imposto.PIS ?? {}) as Record<string, unknown>)[0] as Record<string, unknown> ?? {};

    // COFINS
    const cofinsData = Object.values((imposto.COFINS ?? {}) as Record<string, unknown>)[0] as Record<string, unknown> ?? {};

    const cstIcms = str(icmsData.CST);
    const csosnIcms = str(icmsData.CSOSN);

    return {
      itemNumber: num(det['@_nItem'] ?? idx + 1),
      productCode: str(prod.cProd) || undefined,
      description: str(prod.xProd),
      ncm: str(prod.NCM) || undefined,
      cfop: str(prod.CFOP),
      unitOfMeasure: str(prod.uCom) || undefined,
      quantity: num(prod.qCom),
      unitValue: num(prod.vUnCom),
      totalValue: num(prod.vProd),
      discount: num(prod.vDesc),
      cstIcms: cstIcms || undefined,
      csosnIcms: csosnIcms || undefined,
      cstIpi: str(ipiData.CST) || undefined,
      cstPisCofins: str(pisData.CST) || undefined,
      baseIcms: num(icmsData.vBC),
      icmsRate: num(icmsData.pICMS),
      valueIcms: num(icmsData.vICMS),
      baseIcmsSt: num(icmsData.vBCST),
      icmsStRate: num(icmsData.pICMSST),
      valueIcmsSt: num(icmsData.vICMSST),
      ipiRate: num(ipiData.pIPI),
      valueIpi: num(ipiData.vIPI),
      pisRate: num(pisData.pPIS),
      valuePis: num(pisData.vPIS),
      cofinsRate: num(cofinsData.pCOFINS),
      valueCofins: num(cofinsData.vCOFINS),
      allowsCredit: false,
    };
  });

  return {
    documentType,
    documentNumber: str(ide.nNF),
    series: str(ide.serie) || undefined,
    accessKey: infNFeId.length === 44 ? infNFeId : undefined,
    issueDate: parseDate(ide.dhEmi ?? ide.dEmi),
    entryExitDate: ide.dhSaiEnt || ide.dSaiEnt ? parseDate(ide.dhSaiEnt ?? ide.dSaiEnt) : undefined,
    cnpjIssuer: str(emit.CNPJ),
    nameIssuer: str(emit.xNome),
    stateRegIssuer: str(emit.IE) || undefined,
    ufIssuer: str(emit.enderEmit?.UF) || undefined,
    cnpjRecipient: str(dest.CNPJ || dest.CPF) || undefined,
    nameRecipient: str(dest.xNome) || undefined,
    stateRegRecipient: str(dest.IE) || undefined,
    ufRecipient: str(dest.enderDest?.UF) || undefined,
    totalProducts: num(total.vProd),
    totalDocument: num(total.vNF),
    totalFreight: num(total.vFrete),
    totalInsurance: num(total.vSeg),
    totalDiscount: num(total.vDesc),
    totalOther: num(total.vOutro),
    baseIcms: num(total.vBC),
    valueIcms: num(total.vICMS),
    baseIcmsSt: num(total.vBCST),
    valueIcmsSt: num(total.vST),
    valueIpi: num(total.vIPI),
    valuePis: num(total.vPIS),
    valueCofins: num(total.vCOFINS),
    baseIss: 0,
    valueIss: 0,
    valueIssRetained: 0,
    valueInss: 0,
    valueIrrf: 0,
    valueCsll: 0,
    items,
  };
}

export function parseCTeXml(xmlContent: string): ParsedDocument {
  const json = parser.parse(xmlContent);
  const cteProc = json.cteProc ?? json.CTe;
  const cte = cteProc?.CTe ?? cteProc;
  const infCte = cte?.infCte;

  if (!infCte) throw new Error('XML inválido: estrutura CT-e não reconhecida.');

  const ide = infCte.ide ?? {};
  const emit = infCte.emit ?? {};
  const dest = infCte.dest ?? {};
  const vPrest = infCte.vPrest ?? {};
  const imp = infCte.imp ?? {};

  const infNFeId: string = str(infCte['@_Id'] ?? '').replace('CTe', '');

  const totalFrete = num(vPrest.vTPrest);

  return {
    documentType: 'CT_E',
    documentNumber: str(ide.nCT),
    series: str(ide.serie) || undefined,
    accessKey: infNFeId.length === 44 ? infNFeId : undefined,
    issueDate: parseDate(ide.dhEmi),
    cnpjIssuer: str(emit.CNPJ),
    nameIssuer: str(emit.xNome),
    stateRegIssuer: str(emit.IE) || undefined,
    ufIssuer: str(ide.UFIni) || undefined,
    cnpjRecipient: str(dest.CNPJ || dest.CPF) || undefined,
    nameRecipient: str(dest.xNome) || undefined,
    ufRecipient: str(ide.UFFim) || undefined,
    totalProducts: 0,
    totalDocument: totalFrete,
    totalFreight: totalFrete,
    totalInsurance: 0,
    totalDiscount: 0,
    totalOther: 0,
    baseIcms: num(imp.ICMS?.ICMS00?.vBC ?? imp.ICMS?.ICMS20?.vBC ?? 0),
    valueIcms: num(imp.ICMS?.ICMS00?.vICMS ?? imp.ICMS?.ICMS20?.vICMS ?? 0),
    baseIcmsSt: 0,
    valueIcmsSt: 0,
    valueIpi: 0,
    valuePis: 0,
    valueCofins: 0,
    baseIss: 0,
    valueIss: 0,
    valueIssRetained: 0,
    valueInss: 0,
    valueIrrf: 0,
    valueCsll: 0,
    items: [{
      itemNumber: 1,
      description: str(infCte.ide?.xMunIni) ? `Frete ${str(infCte.ide.xMunIni)} → ${str(infCte.ide.xMunFim)}` : 'Serviço de Transporte',
      cfop: str(ide.CFOP) || '5352',
      quantity: 1,
      unitValue: totalFrete,
      totalValue: totalFrete,
      discount: 0,
      baseIcms: num(imp.ICMS?.ICMS00?.vBC ?? 0),
      icmsRate: num(imp.ICMS?.ICMS00?.pICMS ?? 0),
      valueIcms: num(imp.ICMS?.ICMS00?.vICMS ?? 0),
      baseIcmsSt: 0, icmsStRate: 0, valueIcmsSt: 0,
      ipiRate: 0, valueIpi: 0,
      pisRate: 0, valuePis: 0,
      cofinsRate: 0, valueCofins: 0,
      allowsCredit: false,
    }],
  };
}
