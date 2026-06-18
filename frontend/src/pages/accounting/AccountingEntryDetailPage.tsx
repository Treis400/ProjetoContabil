import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import {
  fetchEntry, reverseEntryApi, deleteEntryApi, fetchAccounts,
} from '../../services/accountingService';
import type { EntryStatus, EntrySource } from '../../types';

const STATUS_LABELS: Record<EntryStatus, string> = {
  RASCUNHO: 'Rascunho', CONFIRMADO: 'Confirmado', ESTORNADO: 'Estornado',
};
const STATUS_COLORS: Record<EntryStatus, string> = {
  RASCUNHO: 'bg-yellow-50 text-yellow-700',
  CONFIRMADO: 'bg-green-50 text-green-700',
  ESTORNADO: 'bg-slate-100 text-slate-500',
};
const SOURCE_LABELS: Record<EntrySource, string> = {
  MANUAL: 'Manual', FISCAL: 'Fiscal', FOLHA: 'Folha',
  FINANCEIRO: 'Financeiro', ESTORNO: 'Estorno',
};

export function AccountingEntryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: entry, isLoading } = useQuery({
    queryKey: ['accounting-entry', id],
    queryFn: () => fetchEntry(id!),
    enabled: !!id,
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts', entry?.clientId],
    queryFn: () => fetchAccounts(entry!.clientId),
    enabled: !!entry?.clientId,
  });

  const accountMap = Object.fromEntries(accounts.map(a => [a.id, a]));

  const reverse = useMutation({
    mutationFn: reverseEntryApi,
    onSuccess: (reversal) => {
      qc.invalidateQueries({ queryKey: ['accounting-entry', id] });
      navigate(`/contabil/lancamentos/${reversal.id}`);
    },
    onError: (e: Error) => alert(e.message),
  });

  const remove = useMutation({
    mutationFn: deleteEntryApi,
    onSuccess: () => navigate('/contabil/lancamentos'),
    onError: (e: Error) => alert(e.message),
  });

  if (isLoading) return <p className="text-slate-400 p-8">Carregando...</p>;
  if (!entry) return <p className="text-slate-400 p-8">Lançamento não encontrado.</p>;

  const fmt = (v: string | number) => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

  const totalDebits  = entry.lines.filter(l => l.debitCredit === 'DEBITO').reduce((s, l)  => s + Number(l.value), 0);
  const totalCredits = entry.lines.filter(l => l.debitCredit === 'CREDITO').reduce((s, l) => s + Number(l.value), 0);

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title={`Lançamento #${entry.entryNumber}`}
        description={`${fmtDate(entry.entryDate)} — ${entry.description}`}
        action={
          <div className="flex gap-2">
            <Link
              to={`/contabil/lancamentos?clientId=${entry.clientId}`}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              ← Diário
            </Link>
            {entry.status === 'CONFIRMADO' && (
              <button
                type="button"
                onClick={() => { if (confirm('Estornar este lançamento?')) reverse.mutate(entry.id); }}
                disabled={reverse.isPending}
                className="rounded-xl border border-orange-300 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-50 disabled:opacity-50"
              >
                Estornar
              </button>
            )}
            {entry.status !== 'CONFIRMADO' && (
              <button
                type="button"
                onClick={() => { if (confirm('Excluir este lançamento?')) remove.mutate(entry.id); }}
                disabled={remove.isPending}
                className="rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                Excluir
              </button>
            )}
          </div>
        }
      />

      {/* Cabeçalho do lançamento */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-slate-500 mb-1">Número</p>
            <p className="font-mono font-semibold">#{entry.entryNumber}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Data</p>
            <p className="font-medium">{fmtDate(entry.entryDate)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Período</p>
            <p className="font-medium">{String(entry.periodMonth).padStart(2, '0')}/{entry.periodYear}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Status</p>
            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[entry.status]}`}>
              {STATUS_LABELS[entry.status]}
            </span>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-slate-500 mb-1">Descrição</p>
            <p className="font-medium text-slate-800">{entry.description}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Origem</p>
            <p className="text-slate-700">{SOURCE_LABELS[entry.source]}</p>
          </div>
          {entry.documentRef && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Referência</p>
              <p className="text-slate-700">{entry.documentRef}</p>
            </div>
          )}
          {entry.createdBy && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Criado por</p>
              <p className="text-slate-700">{entry.createdBy.name}</p>
            </div>
          )}
          {entry.reversedById && (
            <div className="col-span-2">
              <p className="text-xs text-slate-500 mb-1">Estornado por</p>
              <Link
                to={`/contabil/lancamentos/${entry.reversedById}`}
                className="text-sky-600 text-sm hover:underline"
              >
                Ver lançamento de estorno →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Partidas */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-700">Partidas</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs text-slate-500 w-8">#</th>
              <th className="px-4 py-2.5 text-left text-xs text-slate-500">Conta</th>
              <th className="px-4 py-2.5 text-left text-xs text-slate-500 w-20">D/C</th>
              <th className="px-4 py-2.5 text-right text-xs text-slate-500 w-36">Valor</th>
              <th className="px-4 py-2.5 text-left text-xs text-slate-500">Complemento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {entry.lines.map(line => {
              const acc = accountMap[line.accountId];
              return (
                <tr key={line.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-xs text-slate-400">{line.lineNumber}</td>
                  <td className="px-4 py-3">
                    {acc ? (
                      <div>
                        <span className="font-mono text-xs text-slate-400 mr-2">{acc.code}</span>
                        <span className="text-slate-700">{acc.name}</span>
                      </div>
                    ) : (
                      <span className="font-mono text-xs text-slate-400">{line.accountId}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold ${line.debitCredit === 'DEBITO' ? 'text-blue-700' : 'text-rose-700'}`}>
                      {line.debitCredit === 'DEBITO' ? 'D' : 'C'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    <span className={line.debitCredit === 'DEBITO' ? 'text-blue-700' : 'text-rose-700'}>
                      {fmt(line.value)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{line.complement ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t border-slate-200 bg-slate-50">
            <tr>
              <td colSpan={3} className="px-4 py-3 text-xs text-slate-500 font-semibold text-right">Total</td>
              <td className="px-4 py-3 text-right">
                <div className="text-xs font-mono space-y-0.5">
                  <div className="text-blue-700">D: {fmt(totalDebits)}</div>
                  <div className="text-rose-700">C: {fmt(totalCredits)}</div>
                </div>
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
