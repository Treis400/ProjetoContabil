import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../../components/PageHeader';
import { fetchApurations, createApurationApi, deleteApurationApi } from '../../services/fiscalService';
import type { TaxApuration, TaxApurationType, TaxApurationPayload } from '../../types';

const TAX_LABELS: Record<TaxApurationType, string> = {
  ICMS: 'ICMS',
  IPI: 'IPI',
  PIS_COFINS: 'PIS/COFINS',
  ISS: 'ISS',
  SIMPLES_NACIONAL: 'Simples Nacional',
};

const STATUS_LABELS: Record<string, string> = {
  ABERTA: 'Aberta',
  CALCULADA: 'Calculada',
  ENCERRADA: 'Encerrada',
};

const STATUS_COLORS: Record<string, string> = {
  ABERTA: 'bg-yellow-100 text-yellow-700',
  CALCULADA: 'bg-blue-100 text-blue-700',
  ENCERRADA: 'bg-green-100 text-green-700',
};

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

type NewForm = {
  clientId: string;
  taxType: TaxApurationType;
  periodMonth: number;
  periodYear: number;
  notes: string;
};

export function TaxApurationPage() {
  const qc = useQueryClient();
  const [clientId, setClientId] = useState('');
  const [filterYear, setFilterYear] = useState<number>(currentYear);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewForm>({
    clientId: '',
    taxType: 'ICMS',
    periodMonth: new Date().getMonth() + 1,
    periodYear: currentYear,
    notes: '',
  });

  const { data: apuracoes = [], isLoading } = useQuery({
    queryKey: ['apuracoes', clientId, filterYear],
    queryFn: () => fetchApurations(clientId, filterYear),
    enabled: !!clientId,
  });

  const create = useMutation({
    mutationFn: (payload: TaxApurationPayload) => createApurationApi(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['apuracoes'] });
      setShowForm(false);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteApurationApi(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['apuracoes'] }),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    create.mutate(form);
  }

  const grouped = apuracoes.reduce<Record<string, TaxApuration[]>>((acc, a) => {
    const key = `${a.periodYear}-${String(a.periodMonth).padStart(2, '0')}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        title="Apuração de Tributos"
        description="Calcule ICMS, IPI, PIS/COFINS, ISS e Simples Nacional por período"
        action={
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
          >
            + Nova Apuração
          </button>
        }
      />

      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-slate-500 mb-1">CNPJ / ID do Cliente</label>
          <input
            className="input"
            placeholder="Cole o ID do cliente aqui"
            value={clientId}
            onChange={(e) => setClientId(e.target.value.trim())}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Ano</label>
          <select className="input w-32" value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))}>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Modal nova apuração */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Nova Apuração</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">ID do Cliente *</label>
                <input required className="input" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Mês *</label>
                  <select required className="input" value={form.periodMonth} onChange={(e) => setForm({ ...form, periodMonth: Number(e.target.value) })}>
                    {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Ano *</label>
                  <select required className="input" value={form.periodYear} onChange={(e) => setForm({ ...form, periodYear: Number(e.target.value) })}>
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Tipo de Tributo *</label>
                <select required className="input" value={form.taxType} onChange={(e) => setForm({ ...form, taxType: e.target.value as TaxApurationType })}>
                  {Object.entries(TAX_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Observações</label>
                <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              {create.error && (
                <p className="text-sm text-red-600">{(create.error as Error).message}</p>
              )}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm">Cancelar</button>
                <button type="submit" disabled={create.isPending} className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50">
                  {create.isPending ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Conteúdo */}
      {!clientId ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
          Informe o ID do cliente para visualizar as apurações
        </div>
      ) : isLoading ? (
        <p className="text-slate-400">Carregando...</p>
      ) : apuracoes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
          Nenhuma apuração encontrada para {filterYear}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped)
            .sort((a, b) => b[0].localeCompare(a[0]))
            .map(([key, items]) => {
              const [year, month] = key.split('-');
              return (
                <div key={key} className="rounded-2xl border border-slate-200 bg-white">
                  <div className="border-b border-slate-100 px-5 py-3">
                    <h3 className="font-semibold text-slate-700">
                      {MONTHS[Number(month) - 1]} / {year}
                    </h3>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {items.map((ap) => (
                      <div key={ap.id} className="flex items-center justify-between px-5 py-4">
                        <div className="flex items-center gap-4">
                          <span className="w-28 text-sm font-semibold text-slate-800">{TAX_LABELS[ap.taxType]}</span>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[ap.status]}`}>
                            {STATUS_LABELS[ap.status]}
                          </span>
                          {ap.result && (
                            <span className="text-sm text-slate-500">
                              Imposto devido: <strong className="text-slate-800">R$ {Number(ap.result.taxDue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Link
                            to={`/fiscal/apuracoes/${ap.id}`}
                            className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-sky-400 hover:text-sky-600"
                          >
                            Detalhar
                          </Link>
                          {ap.status !== 'ENCERRADA' && (
                            <button
                              type="button"
                              onClick={() => { if (confirm('Excluir esta apuração?')) remove.mutate(ap.id); }}
                              className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
                            >
                              Excluir
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
