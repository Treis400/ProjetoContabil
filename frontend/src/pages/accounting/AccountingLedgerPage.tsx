import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { fetchLedger, fetchAccounts } from '../../services/accountingService';

const MONTHS = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function AccountingLedgerPage() {
  const [clientId, setClientId]   = useState('');
  const [accountId, setAccountId] = useState('');
  const [accountSearch, setAccountSearch] = useState('');
  const [periodMonth, setPeriodMonth] = useState<number>(new Date().getMonth() + 1);
  const [periodYear, setPeriodYear]   = useState<number>(new Date().getFullYear());

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts', clientId],
    queryFn: () => fetchAccounts(clientId),
    enabled: !!clientId,
  });

  const analyticalAccounts = accounts.filter(a => a.allowsEntry && a.active);
  const filteredAccounts = accountSearch
    ? analyticalAccounts.filter(a =>
        a.code.includes(accountSearch) || a.name.toLowerCase().includes(accountSearch.toLowerCase())
      ).slice(0, 8)
    : [];

  const selectedAccount = accounts.find(a => a.id === accountId);

  const { data: lines = [], isLoading } = useQuery({
    queryKey: ['ledger', clientId, accountId, periodMonth, periodYear],
    queryFn: () => fetchLedger({ clientId, accountId, periodMonth: periodMonth || undefined, periodYear: periodYear || undefined }),
    enabled: !!clientId && !!accountId,
  });

  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

  const totalDebits  = lines.filter(l => l.debitCredit === 'DEBITO').reduce((s, l)  => s + Number(l.value), 0);
  const totalCredits = lines.filter(l => l.debitCredit === 'CREDITO').reduce((s, l) => s + Number(l.value), 0);
  const finalBalance = lines.length > 0 ? lines[lines.length - 1].runningBalance : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Razão Analítico"
        description="Movimentação de uma conta no período"
      />

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <input
          className="input w-52"
          placeholder="ID do Cliente"
          value={clientId}
          onChange={e => { setClientId(e.target.value.trim()); setAccountId(''); }}
        />

        {/* Seleção de conta com busca */}
        <div className="relative">
          {accountId && selectedAccount ? (
            <div className="input flex items-center gap-2 w-72">
              <span className="font-mono text-xs text-slate-400">{selectedAccount.code}</span>
              <span className="flex-1 text-sm text-slate-700 truncate">{selectedAccount.name}</span>
              <button type="button" onClick={() => { setAccountId(''); setAccountSearch(''); }} className="text-slate-300 hover:text-red-400">×</button>
            </div>
          ) : (
            <>
              <input
                className="input w-72"
                placeholder="Buscar conta por código ou nome..."
                value={accountSearch}
                onChange={e => setAccountSearch(e.target.value)}
                disabled={!clientId}
              />
              {filteredAccounts.length > 0 && (
                <div className="absolute left-0 top-full z-10 mt-1 w-80 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                  {filteredAccounts.map(a => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => { setAccountId(a.id); setAccountSearch(''); }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-sky-50"
                    >
                      <span className="font-mono text-slate-400 w-20 shrink-0">{a.code}</span>
                      <span className="text-slate-700 truncate">{a.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <select
          className="input w-28"
          value={periodMonth}
          onChange={e => setPeriodMonth(Number(e.target.value))}
        >
          <option value="">Todos</option>
          {MONTHS.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
        </select>
        <input
          type="number"
          className="input w-24"
          placeholder="Ano"
          value={periodYear}
          onChange={e => setPeriodYear(Number(e.target.value))}
        />
      </div>

      {/* Resumo */}
      {lines.length > 0 && (
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
            <p className="text-xs text-slate-500 mb-1">Saldo Final</p>
            <p className={`text-lg font-semibold ${finalBalance >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
              R$ {fmt(finalBalance)}
            </p>
          </div>
        </div>
      )}

      {/* Tabela */}
      {!clientId || !accountId ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
          Selecione o cliente e a conta para ver o razão
        </div>
      ) : isLoading ? (
        <p className="text-slate-400">Carregando...</p>
      ) : lines.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
          Nenhuma movimentação encontrada para esta conta no período
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-100 px-4 py-3 bg-slate-50">
            <p className="text-sm font-semibold text-slate-700">
              {selectedAccount?.code} — {selectedAccount?.name}
            </p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs text-slate-500 w-28">Data</th>
                <th className="px-4 py-2.5 text-left text-xs text-slate-500 w-16">Nº</th>
                <th className="px-4 py-2.5 text-left text-xs text-slate-500">Histórico</th>
                <th className="px-4 py-2.5 text-right text-xs text-slate-500 w-32">Débito</th>
                <th className="px-4 py-2.5 text-right text-xs text-slate-500 w-32">Crédito</th>
                <th className="px-4 py-2.5 text-right text-xs text-slate-500 w-36">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {lines.map(line => (
                <tr key={line.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-slate-600">{fmtDate(line.entry.entryDate)}</td>
                  <td className="px-4 py-2.5">
                    <Link
                      to={`/contabil/lancamentos/${line.entryId}`}
                      className="font-mono text-xs text-sky-600 hover:underline"
                    >
                      #{line.entry.entryNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-slate-700">
                    {line.entry.description}
                    {line.complement && <span className="text-xs text-slate-400 ml-1">({line.complement})</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-blue-700">
                    {line.debitCredit === 'DEBITO' ? fmt(Number(line.value)) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-rose-700">
                    {line.debitCredit === 'CREDITO' ? fmt(Number(line.value)) : '—'}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-mono font-semibold ${line.runningBalance < 0 ? 'text-red-600' : 'text-slate-700'}`}>
                    {fmt(line.runningBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-slate-200 bg-slate-50">
              <tr>
                <td colSpan={3} className="px-4 py-3 text-xs font-semibold text-slate-500 text-right">Total</td>
                <td className="px-4 py-3 text-right font-mono font-semibold text-blue-700">{fmt(totalDebits)}</td>
                <td className="px-4 py-3 text-right font-mono font-semibold text-rose-700">{fmt(totalCredits)}</td>
                <td className={`px-4 py-3 text-right font-mono font-semibold ${finalBalance < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                  {fmt(finalBalance)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
