import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { FormField } from '../../components/FormField';
import {
  fetchFiscalProduct,
  createFiscalProduct,
  updateFiscalProduct,
} from '../../services/fiscalService';
import type { FiscalProductPayload } from '../../types';

const defaultForm: FiscalProductPayload = {
  internalCode: '',
  description: '',
  unitOfMeasure: '',
  barcode: '',
  ncm: '',
  cest: '',
  group: '',
  subgroup: '',
  cfopInbound: '',
  cfopOutbound: '',
  cstIcms: '',
  csosnIcms: '',
  cstIpi: '',
  cstPisCofins: '',
  icmsInternalRate: null,
  icmsInterstateRate: null,
  icmsStRate: null,
  ipiRate: null,
  pisRate: null,
  cofinsRate: null,
  generatesPisCofinsCredit: false,
  isMonophasic: false,
  isSubjectToSt: false,
  generatesDifal: false,
  isImported: false,
  isFuel: false,
  isEnergy: false,
  isCommunication: false,
  isTransport: false,
  isForConsumption: false,
  isForResale: false,
  isFixedAsset: false,
  active: true,
};

export function FiscalProductFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('clientId') ?? '';
  const isEdit = Boolean(id);

  const [form, setForm] = useState<FiscalProductPayload>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    fetchFiscalProduct(id!)
      .then((p) => {
        const { id: _id, clientId: _cid, createdAt: _c, updatedAt: _u, ...rest } = p;
        setForm(rest as FiscalProductPayload);
      })
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function set(field: keyof FiscalProductPayload, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        await updateFiscalProduct(id!, form);
      } else {
        await createFiscalProduct(clientId, form);
      }
      navigate(`/fiscal/produtos?clientId=${clientId}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Erro ao salvar produto.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="py-12 text-center text-sm text-slate-400">Carregando...</div>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title={isEdit ? 'Editar Produto Fiscal' : 'Novo Produto Fiscal'}
        description="Preencha os dados tributários do produto"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados básicos */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Identificação</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="Código interno" required>
              <input
                className="input"
                value={form.internalCode}
                onChange={(e) => set('internalCode', e.target.value)}
                required
              />
            </FormField>
            <FormField label="Descrição" required>
              <input
                className="input"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                required
              />
            </FormField>
            <FormField label="Unidade de medida" required tooltip="Ex: UN, KG, CX, LT">
              <input
                className="input"
                value={form.unitOfMeasure}
                onChange={(e) => set('unitOfMeasure', e.target.value)}
                required
              />
            </FormField>
            <FormField label="Código de barras">
              <input className="input" value={form.barcode ?? ''} onChange={(e) => set('barcode', e.target.value)} />
            </FormField>
            <FormField label="Grupo">
              <input className="input" value={form.group ?? ''} onChange={(e) => set('group', e.target.value)} />
            </FormField>
            <FormField label="Subgrupo">
              <input className="input" value={form.subgroup ?? ''} onChange={(e) => set('subgroup', e.target.value)} />
            </FormField>
          </div>
        </section>

        {/* NCM / CEST */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Classificação Fiscal</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="NCM" required tooltip="Nomenclatura Comum do Mercosul (8 dígitos)">
              <input
                className="input font-mono"
                value={form.ncm}
                onChange={(e) => set('ncm', e.target.value)}
                maxLength={10}
                required
              />
            </FormField>
            <FormField label="CEST" tooltip="Código Especificador de Substituição Tributária">
              <input
                className="input font-mono"
                value={form.cest ?? ''}
                onChange={(e) => set('cest', e.target.value)}
                maxLength={7}
              />
            </FormField>
            <FormField label="CFOP Entrada">
              <input
                className="input font-mono"
                value={form.cfopInbound ?? ''}
                onChange={(e) => set('cfopInbound', e.target.value)}
                maxLength={5}
              />
            </FormField>
            <FormField label="CFOP Saída">
              <input
                className="input font-mono"
                value={form.cfopOutbound ?? ''}
                onChange={(e) => set('cfopOutbound', e.target.value)}
                maxLength={5}
              />
            </FormField>
            <FormField label="CST ICMS">
              <input
                className="input font-mono"
                value={form.cstIcms ?? ''}
                onChange={(e) => set('cstIcms', e.target.value)}
                maxLength={3}
              />
            </FormField>
            <FormField label="CSOSN (Simples)" tooltip="Código de Situação da Operação no Simples Nacional">
              <input
                className="input font-mono"
                value={form.csosnIcms ?? ''}
                onChange={(e) => set('csosnIcms', e.target.value)}
                maxLength={3}
              />
            </FormField>
            <FormField label="CST IPI">
              <input
                className="input font-mono"
                value={form.cstIpi ?? ''}
                onChange={(e) => set('cstIpi', e.target.value)}
                maxLength={2}
              />
            </FormField>
            <FormField label="CST PIS/COFINS">
              <input
                className="input font-mono"
                value={form.cstPisCofins ?? ''}
                onChange={(e) => set('cstPisCofins', e.target.value)}
                maxLength={2}
              />
            </FormField>
          </div>
        </section>

        {/* Alíquotas */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Alíquotas (%)</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {(
              [
                ['icmsInternalRate', 'ICMS Interna'],
                ['icmsInterstateRate', 'ICMS Interestad.'],
                ['icmsStRate', 'ICMS ST'],
                ['ipiRate', 'IPI'],
                ['pisRate', 'PIS'],
                ['cofinsRate', 'COFINS'],
              ] as [keyof FiscalProductPayload, string][]
            ).map(([field, label]) => (
              <FormField key={field} label={label}>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  max="100"
                  className="input font-mono"
                  value={form[field] != null ? String(form[field]) : ''}
                  onChange={(e) => set(field, e.target.value ? Number(e.target.value) : null)}
                />
              </FormField>
            ))}
          </div>
        </section>

        {/* Indicadores */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Indicadores</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {(
              [
                ['generatesPisCofinsCredit', 'Gera crédito PIS/COFINS'],
                ['isMonophasic', 'Regime monofásico'],
                ['isSubjectToSt', 'Sujeito a ST'],
                ['generatesDifal', 'Gera DIFAL'],
                ['isImported', 'Produto importado'],
                ['isFuel', 'Combustível'],
                ['isEnergy', 'Energia elétrica'],
                ['isCommunication', 'Comunicação'],
                ['isTransport', 'Transporte'],
                ['isForConsumption', 'Uso/consumo'],
                ['isForResale', 'Revenda'],
                ['isFixedAsset', 'Ativo imobilizado'],
              ] as [keyof FiscalProductPayload, string][]
            ).map(([field, label]) => (
              <label key={field} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-sky-600"
                  checked={Boolean(form[field])}
                  onChange={(e) => set(field, e.target.checked)}
                />
                {label}
              </label>
            ))}
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-sky-600"
                checked={form.active}
                onChange={(e) => set('active', e.target.checked)}
              />
              Ativo
            </label>
          </div>
        </section>

        {error && (
          <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(`/fiscal/produtos?clientId=${clientId}`)}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-sky-600 px-5 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
          >
            {saving ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Cadastrar produto'}
          </button>
        </div>
      </form>
    </div>
  );
}
