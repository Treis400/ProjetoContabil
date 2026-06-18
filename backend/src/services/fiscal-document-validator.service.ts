export type ValidationError = {
  field: string;
  message: string;
  severity: 'ERRO' | 'AVISO';
};

type ItemLike = {
  itemNumber?: number | null;
  cfop?: string | null;
  ncm?: string | null;
  quantity?: unknown;
  unitValue?: unknown;
  totalValue?: unknown;
  cstPisCofins?: string | null;
  allowsCredit?: boolean | null;
  baseIcms?: unknown;
  icmsRate?: unknown;
  valueIcms?: unknown;
};

type DocumentInput = {
  documentType: string;
  entryExit: string;
  cnpjIssuer: string;
  cnpjRecipient?: string | null;
  accessKey?: string | null;
  issueDate: Date;
  entryExitDate?: Date | null;
  totalProducts: { toNumber?: () => number } | number | string;
  totalDocument: { toNumber?: () => number } | number | string;
  baseIcms: { toNumber?: () => number } | number | string;
  valueIcms: { toNumber?: () => number } | number | string;
  items: ItemLike[];
};

// CFOPs válidos para entrada (começa com 1, 2, 3)
const CFOP_ENTRADA = /^[123]/;
// CFOPs válidos para saída (começa com 5, 6, 7)
const CFOP_SAIDA = /^[567]/;

// CSTs ICMS que permitem crédito (entrada, regime normal)
const CST_ICMS_CREDITO = new Set(['00', '20', '40', '41', '50', '51', '70', '90']);

export function validateFiscalDocument(doc: DocumentInput): ValidationError[] {
  const errors: ValidationError[] = [];

  // CNPJ emitente obrigatório
  if (!doc.cnpjIssuer || doc.cnpjIssuer.replace(/\D/g, '').length !== 14) {
    errors.push({ field: 'cnpjIssuer', message: 'CNPJ do emitente inválido (deve ter 14 dígitos).', severity: 'ERRO' });
  }

  // Chave de acesso: 44 dígitos para NF-e, NFC-e, CT-e
  if (['NF_E', 'NFC_E', 'CT_E'].includes(doc.documentType)) {
    if (!doc.accessKey) {
      errors.push({ field: 'accessKey', message: 'Chave de acesso obrigatória para este tipo de documento.', severity: 'ERRO' });
    } else if (doc.accessKey.replace(/\D/g, '').length !== 44) {
      errors.push({ field: 'accessKey', message: 'Chave de acesso deve ter 44 dígitos.', severity: 'ERRO' });
    }
  }

  // Data de entrada/saída não pode ser anterior à emissão
  if (doc.entryExitDate && doc.entryExitDate < doc.issueDate) {
    errors.push({ field: 'entryExitDate', message: 'Data de entrada/saída não pode ser anterior à data de emissão.', severity: 'AVISO' });
  }

  // Validar itens
  const toNum = (v: unknown): number => {
    if (v == null) return 0;
    if (typeof v === 'object' && 'toNumber' in (v as object)) return (v as { toNumber: () => number }).toNumber();
    return Number(v) || 0;
  };

  doc.items.forEach((item, idx) => {
    const label = `Item ${(item.itemNumber ?? idx + 1)}`;

    if (!item.cfop) {
      errors.push({ field: `items[${idx}].cfop`, message: `${label}: CFOP obrigatório.`, severity: 'ERRO' });
    } else {
      const cfopCompativel =
        doc.entryExit === 'ENTRADA' ? CFOP_ENTRADA.test(item.cfop) : CFOP_SAIDA.test(item.cfop);
      if (!cfopCompativel) {
        errors.push({
          field: `items[${idx}].cfop`,
          message: `${label}: CFOP ${item.cfop} incompatível com operação de ${doc.entryExit === 'ENTRADA' ? 'entrada' : 'saída'}.`,
          severity: 'ERRO',
        });
      }
    }

    if (item.ncm && !/^\d{8}$/.test(String(item.ncm).replace(/\D/g, ''))) {
      errors.push({ field: `items[${idx}].ncm`, message: `${label}: NCM deve ter 8 dígitos.`, severity: 'AVISO' });
    }

    if (toNum(item.quantity) <= 0) {
      errors.push({ field: `items[${idx}].quantity`, message: `${label}: Quantidade deve ser maior que zero.`, severity: 'ERRO' });
    }

    if (toNum(item.unitValue) <= 0) {
      errors.push({ field: `items[${idx}].unitValue`, message: `${label}: Valor unitário deve ser maior que zero.`, severity: 'ERRO' });
    }

    const cst = item.cstPisCofins;
    if (cst) {
      const cstNum = parseInt(cst, 10);
      if (doc.entryExit === 'ENTRADA' && cstNum >= 50 && cstNum <= 66 && item.allowsCredit) {
        errors.push({
          field: `items[${idx}].allowsCredit`,
          message: `${label}: CST PIS/COFINS ${cst} não permite crédito (regime cumulativo ou tributação especial).`,
          severity: 'AVISO',
        });
      }
    }

    const baseIcms = toNum(item.baseIcms);
    const icmsRate = toNum(item.icmsRate);
    const valueIcms = toNum(item.valueIcms);
    if (baseIcms > 0 && icmsRate > 0 && valueIcms > 0) {
      const calculado = baseIcms * (icmsRate / 100);
      if (Math.abs(calculado - valueIcms) > 0.02) {
        errors.push({
          field: `items[${idx}].valueIcms`,
          message: `${label}: Valor ICMS calculado (${calculado.toFixed(2)}) difere do declarado (${valueIcms.toFixed(2)}).`,
          severity: 'AVISO',
        });
      }
    }
  });

  const toNumDoc = (v: DocumentInput['totalProducts']): number => {
    if (v == null) return 0;
    if (typeof v === 'object' && 'toNumber' in (v as object)) return (v as { toNumber: () => number }).toNumber();
    return Number(v) || 0;
  };

  const somaItens = doc.items.reduce((acc, i) => acc + toNum(i.totalValue), 0);
  if (Math.abs(somaItens - toNumDoc(doc.totalProducts)) > 0.10) {
    errors.push({
      field: 'totalProducts',
      message: `Soma dos itens (${somaItens.toFixed(2)}) difere do total de produtos declarado (${toNumDoc(doc.totalProducts).toFixed(2)}).`,
      severity: 'AVISO',
    });
  }

  return errors;
}

export function deriveValidationStatus(errors: ValidationError[]) {
  if (errors.length === 0) return 'VALIDO';
  if (errors.some((e) => e.severity === 'ERRO')) return 'ERRO';
  return 'DIVERGENTE';
}
