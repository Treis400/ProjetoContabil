import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import * as svc from '../../services/patrimonyService';
import * as clientSvc from '../../services/clientService';

const fmt = (v: any) => Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function PatrimonyDeprecPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [clientId, setClientId] = useState('');
  const [periodMonth, setPeriodMonth] = useState(new Date().getMonth() + 1);
  const [periodYear, setPeriodYear] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => { clientSvc.fetchClients().then(setClients); }, []);

  async function load() {
    if (!clientId) return;
    setSummary(await svc.getDepreciationSummary(clientId, periodMonth, periodYear));
  }

  async function doCalc() {
    if (!clientId) return;
    if (!confirm(`Calcular depreciação de ${String(periodMonth).padStart(2,'0')}/${periodYear}?`)) return;
    setCalculating(true);
    try { await svc.calcDepreciation(clientId, periodMonth, periodYear); await load(); alert('Depreciação calculada!'); }
    finally { setCalculating(false); }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Depreciação" description="Cálculo mensal e acompanhamento da depreciação do ativo imobilizado" />

      <div className="flex flex-wrap gap-3">
        <select className="input" value={clientId} onChange={e => setClientId(e.target.value)}>
          <option value="">Selecione a empresa...</option>
          {clients.map((c: any) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
        </select>
        <select className="input w-24" value={periodMonth} onChange={e => setPeriodMonth(Number(e.target.value))}>
          {Array.from({length:12},(_,i) => <option key={i+1} value={i+1}>{String(i+1).padStart(2,'0')}</option>)}
        </select>
        <input className="input w-28" type="number" value={periodYear} onChange={e => setPeriodYear(Number(e.target.value))} />
        <button className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={load}>Consultar</button>
        <button className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600" onClick={doCalc} disabled={calculating}>
          {calculating ? 'Calculando...' : 'Calcular Depreciação'}
        </button>
      </div>

      {summary && (
        <>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Bens Depreciados', value: summary.count, fmt: (v: any) => String(v) },
              { label: 'Depr. Mensal Total', value: summary.totalMonthlyDeprec, fmt },
              { label: 'Depr. Acum. Total', value: summary.totalAccumDeprec, fmt },
            ].map(s => (
              <div key={s.label} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm text-center">
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className="text-2xl font-bold text-sky-600 mt-1">{s.fmt(s.value)}</p>
              </div>
            ))}
          </div>

          <DataTable headers={['Tombamento', 'Descrição', 'Grupo', 'Valor Inicial', 'Depr. Mensal', 'Depr. Acum.', 'Valor Líquido']}>
            {(summary.records ?? []).length === 0 ? (
              <tr><td colSpan={7} className="py-8 text-center text-sm text-slate-400">Nenhum registro para este período.</td></tr>
            ) : (summary.records ?? []).map((r: any) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-medium">{r.asset?.tombamento}</td>
                <td className="px-4 py-3 text-sm text-slate-900">{r.asset?.description}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{r.asset?.group?.name ?? '—'}</td>
                <td className="px-4 py-3 text-sm">{fmt(r.openingValue)}</td>
                <td className="px-4 py-3 text-sm">{fmt(r.monthlyDeprec)}</td>
                <td className="px-4 py-3 text-sm">{fmt(r.accumDeprecClose)}</td>
                <td className="px-4 py-3 text-sm font-bold text-slate-900">{fmt(r.closingValue)}</td>
              </tr>
            ))}
          </DataTable>
        </>
      )}
    </div>
  );
}
