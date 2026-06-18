import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { FormField } from '../../components/FormField';
import {
  fetchFiscalService,
  createFiscalService,
  updateFiscalService,
} from '../../services/fiscalService';
import type { FiscalServicePayload } from '../../types';

const defaultForm: FiscalServicePayload = {
  internalCode: '',
  description: '',
  municipalCode: '',
  lc116Code: '',
  issRate: null,
  issOwnRule: false,
  issRetainedRule: false,
  issSubstituteRule: false,
  hasInssRetention: false,
  hasIrrfRetention: false,
  hasCsllRetention: false,
  hasPisRetention: false,
  hasCofinsRetention: false,
  isServiceExport: false,
  incidenceMunicipality: null,
  active: true,
};

export function FiscalServiceFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('clientId') ?? '';
  const isEdit = Boolean(id);

  const [form, setForm] = useState<FiscalServicePayload>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    fetchFiscalService(id!)
      .then((s) => {
        const { id: _id, clientId: _cid, createdAt: _c, updatedAt: _u, ...rest } = s;
        setForm(rest as FiscalServicePayload);
      })
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function set(field: keyof FiscalServicePayload, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        await updateFiscalService(id!, form);
      } else {
        await createFiscalService(clientId, form);
      }
      navigate(`/fiscal/servicos?clientId=${clientId}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Erro ao salvar serviço.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="py-12 text-center text-sm text-slate-400">Carregando...</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={isEdit ? 'Editar Serviço Fiscal' : 'Novo Serviço Fiscal'}
        description="Preencha os dados tributários do serviço"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identificação */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Identificação</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <FormField label="Código LC 116" tooltip="Código da lista de serviços da Lei Complementar 116/2003">
              <input
                className="input font-mono"
                value={form.lc116Code ?? ''}
                onChange={(e) => set('lc116Code', e.target.value)}
              />
            </FormField>
            <FormField label="Código Municipal" tooltip="Código do serviço na lista do município">
              <input
                className="input font-mono"
                value={form.municipalCode ?? ''}
                onChange={(e) => set('municipalCode', e.target.value)}
              />
            </FormField>
          </div>
        </section>

        {/* ISS */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">ISS</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Alíquota ISS (%)">
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                className="input font-mono"
                value={form.issRate != null ? String(form.issRate) : ''}
                onChange={(e) => set('issRate', e.target.value ? Number(e.target.value) : null)}
              />
            </FormField>
            <FormField label="Local de incidência" tooltip="Município do tomador ou do prestador">
              <select
                className="input"
                value={form.incidenceMunicipality ?? ''}
                onChange={(e) =>
                  set('incidenceMunicipality', e.target.value || null)
                }
              >
                <option value="">Não aplicável</option>
                <option value="PRESTADOR">Município do Prestador</option>
                <option value="TOMADOR">Município do Tomador</option>
              </select>
            </FormField>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              [
                ['issOwnRule', 'ISS próprio'],
                ['issRetainedRule', 'ISS retido'],
                ['issSubstituteRule', 'ISS substituto'],
                ['isServiceExport', 'Exportação de serviços'],
              ] as [keyof FiscalServicePayload, string][]
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
          </div>
        </section>

        {/* Retenções */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Retenções na Fonte</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {(
              [
                ['hasInssRetention', 'INSS'],
                ['hasIrrfRetention', 'IRRF'],
                ['hasCsllRetention', 'CSLL'],
                ['hasPisRetention', 'PIS'],
                ['hasCofinsRetention', 'COFINS'],
              ] as [keyof FiscalServicePayload, string][]
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
          </div>
        </section>

        {/* Situação */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-sky-600"
              checked={form.active}
              onChange={(e) => set('active', e.target.checked)}
            />
            Serviço ativo
          </label>
        </section>

        {error && (
          <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(`/fiscal/servicos?clientId=${clientId}`)}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-sky-600 px-5 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
          >
            {saving ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Cadastrar serviço'}
          </button>
        </div>
      </form>
    </div>
  );
}
