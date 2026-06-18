import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { FormField } from '../../components/FormField';
import { createFiscalDocument } from '../../services/fiscalService';
import type { FiscalDocumentItemInput, FiscalDocumentPayload, FiscalDocumentType, FiscalEntryExit } from '../../types';

const emptyItem = (): FiscalDocumentItemInput => ({
  itemNumber: 1,
  description: '',
  cfop: '',
  quantity: 1,
  unitValue: 0,
  totalValue: 0,
  discount: 0,
  baseIcms: 0,
  icmsRate: 0,
  valueIcms: 0,
  baseIcmsSt: 0,
  icmsStRate: 0,
  valueIcmsSt: 0,
  ipiRate: 0,
  valueIpi: 0,
  pisRate: 0,
  valuePis: 0,
  cofinsRate: 0,
  valueCofins: 0,
  allowsCredit: false,
});

export function FiscalDocumentFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('clientId') ?? '';

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [header, setHeader] = useState({
    documentType: 'NF_E' as FiscalDocumentType,
    entryExit: 'ENTRADA' as FiscalEntryExit,
    documentNumber: '',
    series: '',
    accessKey: '',
    issueDate: new Date().toISOString().slice(0, 10),
    entryExitDate: '',
    cnpjIssuer: '',
    nameIssuer: '',
    stateRegIssuer: '',
    ufIssuer: '',
    cnpjRecipient: '',
    nameRecipient: '',
    totalFreight: 0,
    totalInsurance: 0,
    totalDiscount: 0,
    totalOther: 0,
    notes: '',
  });

  const [items, setItems] = useState<FiscalDocumentItemInput[]>([emptyItem()]);

  function setH(field: keyof typeof header, value: unknown) {
    setHeader((h) => ({ ...h, [field]: value }));
  }

  function setItem(idx: number, field: keyof FiscalDocumentItemInput, value: unknown) {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      // recalcular total do item
      if (field === 'quantity' || field === 'unitValue' || field === 'discount') {
        const q = field === 'quantity' ? Number(value) : Number(next[idx].quantity);
        const u = field === 'unitValue' ? Number(value) : Number(next[idx].unitValue);
        const d = field === 'discount' ? Number(value) : Number(next[idx].discount ?? 0);
        next[idx].totalValue = Math.max(0, q * u - d);
      }
      return next;
    });
  }

  function addItem() {
    setItems((prev) => [...prev, { ...emptyItem(), itemNumber: prev.length + 1 }]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx).map((item, i) => ({ ...item, itemNumber: i + 1 })));
  }

  const totalProducts = items.reduce((s, i) => s + Number(i.totalValue ?? 0), 0);
  const totalDocument = totalProducts + Number(header.totalFreight) + Number(header.totalInsurance) + Number(header.totalOther) - Number(header.totalDiscount);
  const baseIcms = items.reduce((s, i) => s + Number(i.baseIcms ?? 0), 0);
  const valueIcms = items.reduce((s, i) => s + Number(i.valueIcms ?? 0), 0);
  const valuePis = items.reduce((s, i) => s + Number(i.valuePis ?? 0), 0);
  const valueCofins = items.reduce((s, i) => s + Number(i.valueCofins ?? 0), 0);
  const valueIpi = items.reduce((s, i) => s + Number(i.valueIpi ?? 0), 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload: FiscalDocumentPayload = {
        clientId,
        ...header,
        totalProducts,
        totalDocument,
        baseIcms,
        valueIcms,
        valuePis,
        valueCofins,
        valueIpi,
        baseIcmsSt: items.reduce((s, i) => s + Number(i.baseIcmsSt ?? 0), 0),
        valueIcmsSt: items.reduce((s, i) => s + Number(i.valueIcmsSt ?? 0), 0),
        periodYear: new Date(header.issueDate).getFullYear(),
        periodMonth: new Date(header.issueDate).getMonth() + 1,
        items,
      };
      await createFiscalDocument(payload);
      navigate(`/fiscal/documentos?clientId=${clientId}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Erro ao salvar documento.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title="Digitação Manual de Nota" description="Escrituração de documento fiscal por digitação" />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cabeçalho */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Identificação do Documento</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <FormField label="Tipo" required>
              <select className="input" value={header.documentType} onChange={(e) => setH('documentType', e.target.value)}>
                {[['NF_E','NF-e'],['NFC_E','NFC-e'],['CT_E','CT-e'],['NFS_E','NFS-e'],['PRODUTOR','Produtor'],['ENERGIA','Energia'],['TELECOM','Telecom'],['COMBUSTIVEL','Combustível'],['OUTRO','Outro']].map(([v,l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Entrada/Saída" required>
              <select className="input" value={header.entryExit} onChange={(e) => setH('entryExit', e.target.value)}>
                <option value="ENTRADA">Entrada</option>
                <option value="SAIDA">Saída</option>
              </select>
            </FormField>
            <FormField label="Número" required>
              <input className="input font-mono" value={header.documentNumber} onChange={(e) => setH('documentNumber', e.target.value)} required />
            </FormField>
            <FormField label="Série">
              <input className="input font-mono" value={header.series} onChange={(e) => setH('series', e.target.value)} maxLength={3} />
            </FormField>
            <FormField label="Data emissão" required>
              <input type="date" className="input" value={header.issueDate} onChange={(e) => setH('issueDate', e.target.value)} required />
            </FormField>
            <FormField label="Data entrada/saída">
              <input type="date" className="input" value={header.entryExitDate} onChange={(e) => setH('entryExitDate', e.target.value)} />
            </FormField>
            <FormField label="Chave de acesso" tooltip="44 dígitos — obrigatório para NF-e, NFC-e, CT-e">
              <input className="input font-mono text-xs" value={header.accessKey} onChange={(e) => setH('accessKey', e.target.value)} maxLength={44} />
            </FormField>
          </div>
        </section>

        {/* Emitente */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Emitente</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="CNPJ emitente" required>
              <input className="input font-mono" value={header.cnpjIssuer} onChange={(e) => setH('cnpjIssuer', e.target.value)} maxLength={18} required />
            </FormField>
            <FormField label="Razão social emitente" required>
              <input className="input" value={header.nameIssuer} onChange={(e) => setH('nameIssuer', e.target.value)} required />
            </FormField>
            <FormField label="IE emitente">
              <input className="input" value={header.stateRegIssuer} onChange={(e) => setH('stateRegIssuer', e.target.value)} />
            </FormField>
            <FormField label="UF emitente">
              <input className="input" value={header.ufIssuer} onChange={(e) => setH('ufIssuer', e.target.value)} maxLength={2} />
            </FormField>
          </div>
        </section>

        {/* Destinatário */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Destinatário</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="CNPJ destinatário">
              <input className="input font-mono" value={header.cnpjRecipient} onChange={(e) => setH('cnpjRecipient', e.target.value)} maxLength={18} />
            </FormField>
            <FormField label="Razão social destinatário">
              <input className="input" value={header.nameRecipient} onChange={(e) => setH('nameRecipient', e.target.value)} />
            </FormField>
          </div>
        </section>

        {/* Itens */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Itens do Documento</h2>
            <button type="button" onClick={addItem} className="flex items-center gap-1.5 rounded-xl bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-700 hover:bg-sky-100">
              <Plus size={14} /> Adicionar item
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Item {item.itemNumber}</span>
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)} className="text-slate-400 hover:text-rose-500">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  <div className="lg:col-span-2">
                    <FormField label="Descrição" required>
                      <input className="input" value={item.description} onChange={(e) => setItem(idx, 'description', e.target.value)} required />
                    </FormField>
                  </div>
                  <FormField label="Código">
                    <input className="input" value={item.productCode ?? ''} onChange={(e) => setItem(idx, 'productCode', e.target.value)} />
                  </FormField>
                  <FormField label="NCM">
                    <input className="input font-mono" value={item.ncm ?? ''} onChange={(e) => setItem(idx, 'ncm', e.target.value)} maxLength={8} />
                  </FormField>
                  <FormField label="CFOP" required>
                    <input className="input font-mono" value={item.cfop} onChange={(e) => setItem(idx, 'cfop', e.target.value)} maxLength={5} required />
                  </FormField>
                  <FormField label="UN">
                    <input className="input" value={item.unitOfMeasure ?? ''} onChange={(e) => setItem(idx, 'unitOfMeasure', e.target.value)} maxLength={6} />
                  </FormField>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-6">
                  <FormField label="Qtd" required>
                    <input type="number" step="0.0001" min="0" className="input font-mono" value={item.quantity} onChange={(e) => setItem(idx, 'quantity', Number(e.target.value))} />
                  </FormField>
                  <FormField label="Vl. unit." required>
                    <input type="number" step="0.0001" min="0" className="input font-mono" value={item.unitValue} onChange={(e) => setItem(idx, 'unitValue', Number(e.target.value))} />
                  </FormField>
                  <FormField label="Desconto">
                    <input type="number" step="0.01" min="0" className="input font-mono" value={item.discount ?? 0} onChange={(e) => setItem(idx, 'discount', Number(e.target.value))} />
                  </FormField>
                  <FormField label="Total item">
                    <input type="number" className="input font-mono bg-slate-100" value={Number(item.totalValue).toFixed(2)} readOnly />
                  </FormField>
                  <FormField label="CST ICMS">
                    <input className="input font-mono" value={item.cstIcms ?? ''} onChange={(e) => setItem(idx, 'cstIcms', e.target.value)} maxLength={3} />
                  </FormField>
                  <FormField label="CST PIS/COF">
                    <input className="input font-mono" value={item.cstPisCofins ?? ''} onChange={(e) => setItem(idx, 'cstPisCofins', e.target.value)} maxLength={2} />
                  </FormField>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-6">
                  <FormField label="Base ICMS">
                    <input type="number" step="0.01" min="0" className="input font-mono" value={item.baseIcms ?? 0} onChange={(e) => setItem(idx, 'baseIcms', Number(e.target.value))} />
                  </FormField>
                  <FormField label="Alíq. ICMS%">
                    <input type="number" step="0.01" min="0" max="100" className="input font-mono" value={item.icmsRate ?? 0} onChange={(e) => setItem(idx, 'icmsRate', Number(e.target.value))} />
                  </FormField>
                  <FormField label="Vl. ICMS">
                    <input type="number" step="0.01" min="0" className="input font-mono" value={item.valueIcms ?? 0} onChange={(e) => setItem(idx, 'valueIcms', Number(e.target.value))} />
                  </FormField>
                  <FormField label="Alíq. PIS%">
                    <input type="number" step="0.0001" min="0" className="input font-mono" value={item.pisRate ?? 0} onChange={(e) => setItem(idx, 'pisRate', Number(e.target.value))} />
                  </FormField>
                  <FormField label="Vl. PIS">
                    <input type="number" step="0.01" min="0" className="input font-mono" value={item.valuePis ?? 0} onChange={(e) => setItem(idx, 'valuePis', Number(e.target.value))} />
                  </FormField>
                  <FormField label="Vl. COFINS">
                    <input type="number" step="0.01" min="0" className="input font-mono" value={item.valueCofins ?? 0} onChange={(e) => setItem(idx, 'valueCofins', Number(e.target.value))} />
                  </FormField>
                </div>
                <div className="mt-2">
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                    <input type="checkbox" className="h-3.5 w-3.5" checked={item.allowsCredit ?? false} onChange={(e) => setItem(idx, 'allowsCredit', e.target.checked)} />
                    Permite crédito de PIS/COFINS
                  </label>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Totais */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Totais</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <FormField label="Frete">
              <input type="number" step="0.01" min="0" className="input" value={header.totalFreight} onChange={(e) => setH('totalFreight', Number(e.target.value))} />
            </FormField>
            <FormField label="Seguro">
              <input type="number" step="0.01" min="0" className="input" value={header.totalInsurance} onChange={(e) => setH('totalInsurance', Number(e.target.value))} />
            </FormField>
            <FormField label="Desconto geral">
              <input type="number" step="0.01" min="0" className="input" value={header.totalDiscount} onChange={(e) => setH('totalDiscount', Number(e.target.value))} />
            </FormField>
            <FormField label="Outras despesas">
              <input type="number" step="0.01" min="0" className="input" value={header.totalOther} onChange={(e) => setH('totalOther', Number(e.target.value))} />
            </FormField>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-4">
            {[
              ['Total produtos', totalProducts],
              ['Total documento', totalDocument],
              ['Base ICMS', baseIcms],
              ['Valor ICMS', valueIcms],
            ].map(([label, value]) => (
              <div key={label as string}>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="font-semibold text-slate-800">
                  R$ {Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            ))}
          </div>
        </section>

        <FormField label="Observações">
          <textarea className="input" rows={2} value={header.notes} onChange={(e) => setH('notes', e.target.value)} />
        </FormField>

        {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(`/fiscal/documentos?clientId=${clientId}`)}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancelar
          </button>
          <button type="submit" disabled={saving}
            className="rounded-xl bg-sky-600 px-5 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60">
            {saving ? 'Salvando...' : 'Escriturar documento'}
          </button>
        </div>
      </form>
    </div>
  );
}
