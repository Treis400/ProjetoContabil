import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../components/PageHeader';
import { fetchTrialBalance } from '../../services/accountingService';
import type { AccountClass } from '../../types';

const CLASS_LABELS: Record<AccountClass, string> = {
  ATIVO: 'Ativo', PASSIVO: 'Passivo', PATRIMONIO_LIQUIDO: 'Patrimônio Líquido',
  RECEITA: 'Receita', DESPESA: 'Despesa', CUSTO: 'Custo', RESULTADO: 'Resultado',
};
const CLASS_ORDER: AccountClass[] = ['ATIVO', 'PASSIVO', 'PATRIMONIO_LIQUIDO', 'RECEITA', 'DESPESA', 'CUSTO', 'RESULTADO'];
const CLASS_COLORS: Record<AccountClass, string> = {
  ATIVO: 'text-blue-700', PASSIVO: 'text-red-700', PATRIMONIO_LIQUIDO: 'text-purple-700',
  RECEITA: 'text-green-700', DESPESA: 'text-orange-700', CUSTO: 'text-yellow-700', RESULTADO: 'text-slate-700',
};

const MONTHS = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function AccountingTrialBalancePage() {
  const [clientId, setClientId]     = useState('');
  const [periodMonth, setPeriodMonth] = useState<number>(new Date().getMonth() + 1);
  const [periodYear, setPeriodYear]   = useState<number>(new Date().getFullYear());
  const [filterClass, setFilterClass] = useState('');

  const { data: lines = [], isLoading } = useQuery({
    queryKey: ['trial-balance', clientId, periodMonth, periodYear],
    queryFn: () => fetchTrialBalance({
      clientId,
      periodMonth: periodMonth || undefined,
      periodYear:  periodYear  || undefined,
    }),
    enabled: !!clientId,
  });

  const filtered = filterClass
    ? lines.filter(l => l.account.classification === filterClass)
    : lines;

  const grouped = CLASS_ORDER.reduce<Record<string, typeof lines>>((acc, cls) => {
    const items = filtered.filter(l => l.account.classification === cls);
    if (items.length > 0) acc[cls] = items;
    return acc;
  }, {});

  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  const totalDebits  = filtered.reduce((s, l) => s + l.debits, 0);
  const totalCredits = filtered.reduce((s, l) => s + l.credits, 0);
  const balanced     = Math.abs(totalDebits - totalCredits) < 0.01;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Balancete de Verificação"
        description="Saldos de todas as contas no período"
      />

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <input
          className="input w-52"
          placeholder="ID do Cliente"
          value={clientId}
          onChange={e => setClientId(e.target.value.trim())}
        />
        <select className="input w-28" value={periodMonth} onChange={e => setPeriodMonth(Number(e.target.value))}>
          <option value="">Todos</option>
          {MONTHS.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
        </select>
        <input type="number" className="input w-24" placeholder="Ano" value={periodYear} onChange={e => setPeriodYear(Number(e.target.value))} />
        <select className="input w-44" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
          <option value="">Todas as classes</option>
          {CLASS_ORDER.map(c => <option key={c} value={c}>{CLASS_LABELS[c]}</option>)}
        </select>
      </div>

      {/* Totalizadores */}
      {filtered.length > 0 && (
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
            <p className="text-xs text-slate-500 mb-1">Situação</p>
            <p className={`text-lg font-semibold ${balanced ? 'text-green-700' : 'text-red-600'}`}>
              {balanced ? 'Balanceado ✓' : `Diferença: ${fmt(Math.abs(totalDebits - totalCredits))}`}
            </p>
          </div>
        </div>
      )}

      {!clientId ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
          Informe o ID do cliente
        </div>
      ) : isLoading ? (
        <p className="text-slate-400">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
          Nenhum movimento encontrado no período
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([cls, items]) => {
            const clsDebits  = items.reduce((s, l) => s + l.debits, 0);
            const clsCredits = items.reduce((s, l) => s + l.credits, 0);
            return (
              <div key={cls} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <h3 className={`text-sm font-semibold ${CLASS_COLORS[cls as AccountClass]}`}>
                    {CLASS_LABELS[cls as AccountClass]}
                  </h3>
                  <div className="text-xs font-mono text-slate-500">
                    <span className="text-blue-700">D: {fmt(clsDebits)}</span>
                    <span className="mx-2 text-slate-300">|</span>
                    <span className="text-rose-700">C: {fmt(clsCredits)}</span>
                  </div>
                </div>
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs text-slate-400 font-medium w-28">Código</th>
                      <th className="px-4 py-2 text-left text-xs text-slate-400 font-medium">Nome</th>
                      <th className="px-4 py-2 text-right text-xs text-slate-400 font-medium w-36">Débitos</th>
                      <th className="px-4 py-2 text-right text-xs text-slate-400 font-medium w-36">Créditos</th>
                      <th className="px-4 py-2 text-right text-xs text-slate-400 font-medium w-36">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {items.sort((a, b) => a.account.code.localeCompare(b.account.code)).map(item => (
                      <tr key={item.account.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 font-mono text-xs text-slate-400">{item.account.code}</td>
                        <td className="px-4 py-2.5 text-slate-700">{item.account.name}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-blue-700">{fmt(item.debits)}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-rose-700">{fmt(item.credits)}</td>
                        <td className={`px-4 py-2.5 text-right font-mono font-semibold ${item.balance < 0 ? 'text-red-600' : 'text-slate-700'}`}>
                          {fmt(item.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
