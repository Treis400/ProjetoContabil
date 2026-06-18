import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import {
  fetchEntries, reverseEntryApi, deleteEntryApi,
} from '../../services/accountingService';
import type { EntryStatus } from '../../types';

const STATUS_LABELS: Record<EntryStatus, string> = {
  RASCUNHO: 'Rascunho',
  CONFIRMADO: 'Confirmado',
  ESTORNADO: 'Estornado',
};
const STATUS_COLORS: Record<EntryStatus, string> = {
  RASCUNHO: 'bg-yellow-50 text-yellow-700',
  CONFIRMADO: 'bg-green-50 text-green-700',
  ESTORNADO: 'bg-slate-100 text-slate-500',
};

const MONTHS = [
  '', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

export function AccountingEntriesPage() {
  const qc = useQueryClient();
  const [clientId, setClientId] = useState('');
  const [periodMonth, setPeriodMonth] = useState<number>(new Date().getMonth() + 1);
  const [periodYear, setPeriodYear]   = useState<number>(new Date().getFullYear());
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const queryKey = ['accounting-entries', clientId, periodMonth, periodYear, filterStatus, search, page];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchEntries({
      clientId,
      periodMonth: periodMonth || undefined,
      periodYear:  periodYear  || undefined,
      status: filterStatus || undefined,
      search: search || undefined,
      page,
      limit: 50,
    }),
    enabled: !!clientId,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['accounting-entries', clientId] });

  const reverse = useMutation({
    mutationFn: reverseEntryApi,
    onSuccess: invalidate,
    onError: (e: Error) => alert(e.message),
  });

  const remove = useMutation({
    mutationFn: deleteEntryApi,
    onSuccess: invalidate,
    onError: (e: Error) => alert(e.message),
  });

  const entries = data?.data ?? [];
  const totalDebits  = entries.reduce((s, e) => s + e.lines.filter(l => l.debitCredit === 'DEBITO').reduce((a, l) => a + Number(l.value), 0), 0);
  const totalCredits = entries.reduce((s, e) => s + e.lines.filter(l => l.debitCredit === 'CREDITO').reduce((a, l) => a + Number(l.value), 0), 0);

  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Diário Contábil"
        description="Lançamentos contábeis por período"
        action={
          clientId ? (
            <Link
              to={`/contabil/lancamentos/novo?clientId=${clientId}`}
              className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
            >
              + Novo Lançamento
            </Link>
          ) : null
        }
      />

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <input
          className="input w-52"
          placeholder="ID do Cliente"
          value={clientId}
          onChange={e => { setClientId(e.target.value.trim()); setPage(1); }}
        />
        <select
          className="input w-28"
          value={periodMonth}
          onChange={e => { setPeriodMonth(Number(e.target.value)); setPage(1); }}
        >
          <option value="">Todos os meses</option>
          {MONTHS.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
        </select>
        <input
          type="number"
          className="input w-24"
          placeholder="Ano"
          value={periodYear}
          onChange={e => { setPeriodYear(Number(e.target.value)); setPage(1); }}
        />
        <select className="input w-36" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <input
          className="input flex-1 min-w-[180px]"
          placeholder="Buscar por descrição..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {/* Totalizadores */}
      {entries.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500 mb-1">Total Débitos</p>
            <p className="text-lg font-semibold text-blue-700">R$ {fmt(totalDebits)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500 mb-1">Total Créditos</p>
            <p className="text-lg font-semibold text-rose-700">R$ {fmt(totalCredits)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500 mb-1">Lançamentos</p>
            <p className="text-lg font-semibold text-slate-700">{data?.total ?? 0}</p>
          </div>
        </div>
      )}

      {/* Tabela */}
      {!clientId ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
          Informe o ID do cliente para ver os lançamentos
        </div>
      ) : isLoading ? (
        <p className="text-slate-400">Carregando...</p>
      ) : entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <p className="text-slate-400 mb-4">Nenhum lançamento encontrado</p>
          <Link
            to={`/contabil/lancamentos/novo?clientId=${clientId}`}
            className="rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-600"
          >
            Criar Primeiro Lançamento
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 w-16">Nº</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 w-28">Data</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Descrição</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 w-32">Débitos</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 w-32">Créditos</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 w-28">Status</th>
                <th className="px-4 py-3 w-32"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map(entry => {
                const debits  = entry.lines.filter(l => l.debitCredit === 'DEBITO').reduce((s, l) => s + Number(l.value), 0);
                const credits = entry.lines.filter(l => l.debitCredit === 'CREDITO').reduce((s, l) => s + Number(l.value), 0);
                return (
                  <tr key={entry.id} className={`hover:bg-slate-50 ${entry.status === 'ESTORNADO' ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 font-mono text-slate-500">#{entry.entryNumber}</td>
                    <td className="px-4 py-3 text-slate-600">{fmtDate(entry.entryDate)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{entry.description}</div>
                      {entry.documentRef && <div className="text-xs text-slate-400">Ref: {entry.documentRef}</div>}
                      <div className="text-xs text-slate-400">{entry.lines.length} partidas</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-blue-700">{fmt(debits)}</td>
                    <td className="px-4 py-3 text-right font-mono text-rose-700">{fmt(credits)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[entry.status]}`}>
                        {STATUS_LABELS[entry.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/contabil/lancamentos/${entry.id}`}
                          className="text-xs text-sky-600 hover:underline"
                        >
                          Ver
                        </Link>
                        {entry.status === 'CONFIRMADO' && (
                          <button
                            type="button"
                            onClick={() => { if (confirm('Estornar este lançamento?')) reverse.mutate(entry.id); }}
                            className="text-xs text-orange-500 hover:text-orange-700"
                          >
                            Estornar
                          </button>
                        )}
                        {entry.status !== 'CONFIRMADO' && (
                          <button
                            type="button"
                            onClick={() => { if (confirm('Excluir este lançamento?')) remove.mutate(entry.id); }}
                            className="text-xs text-red-400 hover:text-red-600"
                          >
                            Excluir
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Paginação */}
          {data && data.pages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
              <p className="text-xs text-slate-500">
                {(page - 1) * 50 + 1}–{Math.min(page * 50, data.total)} de {data.total}
              </p>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setPage(p => Math.min(data.pages, p + 1))}
                  disabled={page === data.pages}
                  className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
