import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../../components/PageHeader';
import {
  fetchAccountingParameters, upsertAccountingParametersApi, togglePeriodApi,
} from '../../services/accountingService';
import type { AccountingParameters, ClosingMethod } from '../../types';

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="mb-4 text-base font-semibold text-slate-800">{title}</h3>
      {children}
    </div>
  );
}

function Toggle({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between py-3 cursor-pointer group">
      <div>
        <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{label}</p>
        {description && <p className="text-xs text-slate-400">{description}</p>}
      </div>
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-sky-500' : 'bg-slate-300'}`}
      >
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </div>
    </label>
  );
}

export function AccountingParametersPage() {
  const qc = useQueryClient();
  const [clientId, setClientId] = useState('');
  const [filterYear, setFilterYear] = useState(currentYear);
  const [saved, setSaved] = useState(false);

  const { data: params, isLoading } = useQuery({
    queryKey: ['accountingParams', clientId],
    queryFn: () => fetchAccountingParameters(clientId),
    enabled: !!clientId,
  });

  const [form, setForm] = useState<Partial<AccountingParameters>>({});
  const effective = { ...params, ...form } as Partial<AccountingParameters>;

  const upsert = useMutation({
    mutationFn: () => upsertAccountingParametersApi({ clientId, ...effective }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accountingParams'] }); setForm({}); setSaved(true); setTimeout(() => setSaved(false), 2000); },
  });

  const togglePeriod = useMutation({
    mutationFn: (period: string) => togglePeriodApi(clientId, period),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accountingParams'] }),
  });

  function set<K extends keyof AccountingParameters>(key: K, value: AccountingParameters[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  const closedPeriods = effective.closedPeriods ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parâmetros Contábeis"
        description="Configurações de encerramento, integrações e controle de períodos por empresa"
        action={
          clientId ? (
            <button type="button" onClick={() => upsert.mutate()} disabled={upsert.isPending}
              className={`rounded-xl px-4 py-2 text-sm font-medium text-white transition ${saved ? 'bg-green-500' : 'bg-sky-500 hover:bg-sky-600'} disabled:opacity-50`}>
              {saved ? '✓ Salvo' : upsert.isPending ? 'Salvando...' : 'Salvar Parâmetros'}
            </button>
          ) : undefined
        }
      />

      <div className="flex gap-3">
        <input className="input flex-1 max-w-xs" placeholder="ID do Cliente" value={clientId} onChange={e => { setClientId(e.target.value.trim()); setForm({}); }} />
      </div>

      {!clientId ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400">Informe o ID do cliente</div>
      ) : isLoading ? (
        <p className="text-slate-400">Carregando...</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">

          {/* Encerramento */}
          <Section title="Método de Encerramento">
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Método</label>
                <select className="input" value={effective.closingMethod ?? 'AUTOMATICO'}
                  onChange={e => set('closingMethod', e.target.value as ClosingMethod)}>
                  <option value="AUTOMATICO">Encerramento Automático de Resultado</option>
                  <option value="MANUAL">Encerramento Manual</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Exercício Atual</label>
                <select className="input" value={effective.currentYear ?? currentYear}
                  onChange={e => set('currentYear', Number(e.target.value))}>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">ID Conta de Resultado</label>
                <input className="input font-mono text-xs" placeholder="ID da conta (Resultado do Exercício)"
                  value={effective.resultAccountId ?? ''}
                  onChange={e => set('resultAccountId', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">ID Conta Lucros/Prejuízos Acumulados</label>
                <input className="input font-mono text-xs" placeholder="ID da conta de destino do resultado"
                  value={effective.retainedEarningsAccId ?? ''}
                  onChange={e => set('retainedEarningsAccId', e.target.value)} />
              </div>
            </div>
          </Section>

          {/* Centro de Custo */}
          <Section title="Centro de Custo">
            <div className="divide-y divide-slate-50">
              <Toggle
                label="Obrigatório nos Lançamentos"
                description="Exige vínculo com centro de custo em todos os lançamentos analíticos"
                checked={effective.costCenterRequired ?? false}
                onChange={v => set('costCenterRequired', v)}
              />
            </div>
          </Section>

          {/* Integrações */}
          <Section title="Integrações com Módulos">
            <div className="divide-y divide-slate-50">
              {[
                { key: 'integrateFiscal',    label: 'Módulo Fiscal',      desc: 'Importa lançamentos de NF-e, apurações e obrigações' },
                { key: 'integratePayroll',   label: 'Folha de Pagamento', desc: 'Importa lançamentos de salários, encargos e provisões' },
                { key: 'integrateFinancial', label: 'Financeiro',         desc: 'Importa movimentos de contas a pagar/receber' },
                { key: 'integratePatrimony', label: 'Patrimônio',         desc: 'Importa depreciações e baixas do imobilizado' },
                { key: 'integrateBilling',   label: 'Faturamento',        desc: 'Importa receitas e deduções de faturamento' },
              ].map(({ key, label, desc }) => (
                <Toggle
                  key={key}
                  label={label}
                  description={desc}
                  checked={effective[key as keyof AccountingParameters] as boolean ?? false}
                  onChange={v => set(key as keyof AccountingParameters, v as never)}
                />
              ))}
            </div>
          </Section>

          {/* Controle de Períodos */}
          <Section title="Controle de Períodos">
            <div className="mb-3 flex items-center gap-3">
              <label className="text-xs text-slate-500">Ano</label>
              <select className="input w-28" value={filterYear} onChange={e => setFilterYear(Number(e.target.value))}>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {MONTHS.map((m, i) => {
                const period = `${filterYear}-${String(i + 1).padStart(2, '0')}`;
                const isClosed = closedPeriods.includes(period);
                return (
                  <button
                    key={period}
                    type="button"
                    onClick={() => togglePeriod.mutate(period)}
                    className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                      isClosed
                        ? 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100'
                        : 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    {m}
                    <span className="block text-[10px] mt-0.5 font-normal">
                      {isClosed ? 'Fechado' : 'Aberto'}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Clique para alternar entre aberto/fechado. Períodos fechados bloqueiam novos lançamentos.
            </p>
          </Section>

        </div>
      )}
    </div>
  );
}
