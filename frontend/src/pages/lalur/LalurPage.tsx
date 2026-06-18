import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import * as svc from '../../services/lalurService';
import * as clientSvc from '../../services/clientService';

const NATURE_LABEL: Record<string, string> = { ADICAO: 'Adição', EXCLUSAO: 'Exclusão', COMPENSACAO: 'Compensação' };
const NATURE_COLOR: Record<string, string> = {
  ADICAO: 'bg-red-50 text-red-700', EXCLUSAO: 'bg-green-50 text-green-700', COMPENSACAO: 'bg-yellow-50 text-yellow-700',
};
const CONTROL_TYPE_LABEL: Record<string, string> = {
  PREJUIZO_FISCAL: 'Prejuízo Fiscal', BASE_NEGATIVA_CSLL: 'Base Negativa CSLL',
  AJUSTE_TEMPORARIO: 'Ajuste Temporário', INCENTIVO_FISCAL: 'Incentivo Fiscal',
  DEPRECIACAO_ACELERADA: 'Deprec. Acelerada', AMORTIZACAO_DIFERIDA: 'Amort. Diferida',
  JCP_DIFERIDO: 'JCP Diferido', EQUIVALENCIA_PATRIMONIAL: 'Equiv. Patrimonial', PERDA_RECUPERAVEL: 'Perda Recuperável',
};
const MOV_TYPE_LABEL: Record<string, string> = {
  INCLUSAO: 'Inclusão', UTILIZACAO: 'Utilização', BAIXA: 'Baixa', TRANSFERENCIA: 'Transferência',
};
const MOV_TYPE_COLOR: Record<string, string> = {
  INCLUSAO: 'bg-sky-50 text-sky-700', UTILIZACAO: 'bg-green-50 text-green-700',
  BAIXA: 'bg-red-50 text-red-700', TRANSFERENCIA: 'bg-purple-50 text-purple-700',
};
const ACTION_LABEL: Record<string, string> = {
  CREATE: 'Criação', UPDATE: 'Alteração', DELETE: 'Exclusão',
  LOCK: 'Encerramento', UNLOCK: 'Reabertura', IMPORT: 'Importação',
};

const btn = 'rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50';
const btnSec = 'rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50';
const btnDanger = 'rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600';
const card = 'rounded-3xl border border-slate-200 bg-white p-4 shadow-sm';
const lbl = 'block text-xs font-medium text-slate-500 mb-1';
const fmt = (v: any) => Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

type Tab = 'parteA' | 'parteB' | 'compensacoes' | 'irpj' | 'ecf' | 'parametros' | 'auditoria';

const TABS: { key: Tab; label: string }[] = [
  { key: 'parteA', label: 'Parte A — Ajustes' },
  { key: 'parteB', label: 'Parte B — Diferenças' },
  { key: 'compensacoes', label: 'Compensações' },
  { key: 'irpj', label: 'IRPJ / CSLL' },
  { key: 'ecf', label: 'ECF' },
  { key: 'parametros', label: 'Parâmetros' },
  { key: 'auditoria', label: 'Auditoria' },
];

export function LalurPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [clientId, setClientId] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [period, setPeriod] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>('parteA');

  // Parte A
  const [showPartAForm, setShowPartAForm] = useState(false);
  const [partAForm, setPartAForm] = useState({ description: '', nature: 'ADICAO', timing: 'PERMANENTE', value: '', accountCode: '' });

  // Parte B
  const [showPartBForm, setShowPartBForm] = useState(false);
  const [partBForm, setPartBForm] = useState({
    description: '', type: 'TRIBUTACAO_FUTURA', controlType: 'AJUSTE_TEMPORARIO',
    openingBalance: '0', additions: '0', realizations: '0', originDate: '', originalValue: '',
  });
  const [selectedBalance, setSelectedBalance] = useState<any>(null);
  const [movForm, setMovForm] = useState({ type: 'INCLUSAO', value: '', description: '', documentRef: '', movementDate: '' });
  const [showMovForm, setShowMovForm] = useState(false);

  // Compensações
  const [compensationLimit, setCompensationLimit] = useState<any>(null);
  const [compForm, setCompForm] = useState({ originYear: String(new Date().getFullYear()), type: 'PREJUIZO_FISCAL', originalValue: '', notes: '' });
  const [showCompForm, setShowCompForm] = useState(false);
  const [applyForm, setApplyForm] = useState({ irpjAmount: '0', csllAmount: '0' });

  // IRPJ
  const [irpjForm, setIrpjForm] = useState({ irpjRate: '15', irpjSurchargeRate: '10', csllRate: '9', irpjIncentives: '0', csllIncentives: '0' });

  // Parâmetros — regras contábil
  const [rules, setRules] = useState<any[]>([]);
  const [adjustTypes, setAdjustTypes] = useState<any[]>([]);
  const [ruleForm, setRuleForm] = useState({ accountCode: '', nature: 'ADICAO', description: '', adjustTypeId: '' });
  const [showRuleForm, setShowRuleForm] = useState(false);

  // Auditoria
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => { clientSvc.fetchClients().then(setClients); }, []);
  useEffect(() => { if (clientId) loadPeriod(); }, [clientId, year]);
  useEffect(() => {
    if (clientId) {
      svc.listAdjustTypes(clientId).then(setAdjustTypes).catch(() => {});
      svc.listAccountingRules(clientId).then(setRules).catch(() => {});
    }
  }, [clientId]);
  useEffect(() => {
    if (clientId && period && tab === 'compensacoes') {
      svc.calcCompensationLimit(clientId, year).then(setCompensationLimit).catch(() => {});
    }
    if (clientId && period && tab === 'auditoria') {
      svc.listAuditLogs(clientId, period.id).then(setAuditLogs).catch(() => {});
    }
  }, [tab, period]);

  async function loadPeriod() {
    setLoading(true);
    try { setPeriod(await svc.getPeriod(clientId, year)); }
    catch { setPeriod(null); }
    finally { setLoading(false); }
  }

  async function addPartA(e: React.FormEvent) {
    e.preventDefault();
    await svc.createPartA(period.id, clientId, { ...partAForm, value: Number(partAForm.value) });
    setShowPartAForm(false);
    setPartAForm({ description: '', nature: 'ADICAO', timing: 'PERMANENTE', value: '', accountCode: '' });
    loadPeriod();
  }

  async function addPartB(e: React.FormEvent) {
    e.preventDefault();
    await svc.createPartB(period.id, clientId, {
      ...partBForm,
      openingBalance: Number(partBForm.openingBalance),
      additions: Number(partBForm.additions),
      realizations: Number(partBForm.realizations),
      originalValue: partBForm.originalValue ? Number(partBForm.originalValue) : undefined,
    });
    setShowPartBForm(false);
    setPartBForm({ description: '', type: 'TRIBUTACAO_FUTURA', controlType: 'AJUSTE_TEMPORARIO', openingBalance: '0', additions: '0', realizations: '0', originDate: '', originalValue: '' });
    loadPeriod();
  }

  async function addMovement(e: React.FormEvent) {
    e.preventDefault();
    await svc.createPartBMovement(selectedBalance.id, clientId, { ...movForm, value: Number(movForm.value) });
    setShowMovForm(false);
    setMovForm({ type: 'INCLUSAO', value: '', description: '', documentRef: '', movementDate: '' });
    const updated = await svc.listPartB(period.id, clientId);
    const found = updated.find((b: any) => b.id === selectedBalance.id);
    setSelectedBalance(found ?? null);
    loadPeriod();
  }

  async function doCalcIrpj() {
    await svc.calcIrpjCsll(period.id, clientId, {
      irpjRate: Number(irpjForm.irpjRate), irpjSurchargeRate: Number(irpjForm.irpjSurchargeRate),
      csllRate: Number(irpjForm.csllRate), irpjIncentives: Number(irpjForm.irpjIncentives), csllIncentives: Number(irpjForm.csllIncentives),
    });
    loadPeriod();
  }

  async function doImportAccounting() {
    if (!confirm(`Importar resultado contábil do ano ${year}? Será atualizado o lucro contábil e criados ajustes automáticos pelas regras cadastradas.`)) return;
    try {
      const r = await svc.importAccountingResult(clientId, year);
      alert(`Importação concluída!\nLucro contábil: ${fmt(r.accountingProfit)}\nAjustes automáticos criados: ${r.adjustmentsCreated}`);
      loadPeriod();
    } catch (err: any) {
      alert('Erro: ' + (err?.response?.data?.error ?? err.message));
    }
  }

  async function doApplyCompensation(e: React.FormEvent) {
    e.preventDefault();
    try {
      await svc.applyCompensation(clientId, year, { irpjAmount: Number(applyForm.irpjAmount), csllAmount: Number(applyForm.csllAmount) });
      alert('Compensações aplicadas com sucesso!');
      setCompensationLimit(await svc.calcCompensationLimit(clientId, year));
      loadPeriod();
    } catch (err: any) {
      alert('Erro: ' + (err?.response?.data?.error ?? err.message));
    }
  }

  async function addCompensation(e: React.FormEvent) {
    e.preventDefault();
    await svc.createCompensation(period.id, clientId, { ...compForm, originYear: Number(compForm.originYear), originalValue: Number(compForm.originalValue) });
    setShowCompForm(false);
    setCompForm({ originYear: String(new Date().getFullYear()), type: 'PREJUIZO_FISCAL', originalValue: '', notes: '' });
    setCompensationLimit(await svc.calcCompensationLimit(clientId, year));
  }

  async function addRule(e: React.FormEvent) {
    e.preventDefault();
    await svc.createAccountingRule(clientId, ruleForm);
    setShowRuleForm(false);
    setRuleForm({ accountCode: '', nature: 'ADICAO', description: '', adjustTypeId: '' });
    svc.listAccountingRules(clientId).then(setRules);
  }

  async function doLockPeriod() {
    if (!period.lockedAt) {
      if (!confirm(`Encerrar período LALUR ${year}? Lançamentos ficarão bloqueados.`)) return;
      await svc.lockPeriod(clientId, year);
    } else {
      if (!confirm(`Reabrir período LALUR ${year}?`)) return;
      await svc.unlockPeriod(clientId, year);
    }
    loadPeriod();
  }

  const isLocked = !!period?.lockedAt;

  return (
    <div className="space-y-6">
      <PageHeader
        title="LALUR / LACS"
        description="Livro de Apuração do Lucro Real e Livro de Apuração da Base de Cálculo da CSLL"
      />

      {/* Seleção */}
      <div className={card + ' flex gap-4 items-end flex-wrap'}>
        <div className="flex-1 min-w-48">
          <label className={lbl}>Empresa</label>
          <select className="input" value={clientId} onChange={e => setClientId(e.target.value)}>
            <option value="">Selecione...</option>
            {clients.map((c: any) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Ano-Exercício</label>
          <input className="input w-28" type="number" value={year} onChange={e => setYear(Number(e.target.value))} />
        </div>
      </div>

      {clientId && !period && !loading && (
        <div className={card + ' text-center py-8'}>
          <p className="text-slate-500 mb-4">Período {year} ainda não iniciado para este cliente.</p>
          <button className={btn} onClick={async () => { await svc.upsertPeriod(clientId, year, { taxRegime: 'LUCRO_REAL', accountingProfit: 0 }); loadPeriod(); }}>
            Iniciar Período {year}
          </button>
        </div>
      )}

      {period && (
        <>
          {/* Status do período */}
          {isLocked && (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center gap-3">
              <span className="text-amber-700 font-medium text-sm">Período encerrado</span>
              {period.lockedBy && <span className="text-amber-600 text-sm">por {period.lockedBy.name}</span>}
              <button className={btnSec + ' ml-auto text-xs'} onClick={doLockPeriod}>Reabrir</button>
            </div>
          )}

          {/* Cards resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Lucro Contábil', value: period.accountingProfit, color: 'text-sky-600' },
              { label: 'Total Adições', value: period.totalAdditions, color: 'text-red-600' },
              { label: 'Total Exclusões', value: period.totalExclusions, color: 'text-green-600' },
              { label: 'Lucro Real', value: period.realProfit, color: Number(period.realProfit) >= 0 ? 'text-sky-700' : 'text-red-600' },
            ].map(s => (
              <div key={s.label} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm text-center">
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className={`text-lg font-bold mt-1 ${s.color}`}>{fmt(s.value)}</p>
              </div>
            ))}
          </div>

          {/* Lucro contábil + ações */}
          <div className={card + ' flex gap-4 items-end flex-wrap'}>
            <div>
              <label className={lbl}>Lucro Contábil antes do IRPJ/CSLL (R$)</label>
              <input
                className="input w-60"
                type="number"
                disabled={isLocked}
                defaultValue={Number(period.accountingProfit).toFixed(2)}
                onBlur={async e => { if (!isLocked) { await svc.upsertPeriod(clientId, year, { accountingProfit: Number(e.target.value) }); loadPeriod(); } }}
              />
            </div>
            <button className={btnSec} onClick={doImportAccounting} disabled={isLocked}>Importar do Contábil</button>
            {!isLocked
              ? <button className={btnDanger + ' ml-auto'} onClick={doLockPeriod}>Encerrar Período</button>
              : null}
          </div>

          {/* Abas */}
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 flex gap-0 px-2 pt-2 flex-wrap">
              {TABS.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t.key ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-6">

              {/* ── PARTE A ── */}
              {tab === 'parteA' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-slate-900">Lançamentos da Parte A</h3>
                    {!isLocked && <button className={btn} onClick={() => setShowPartAForm(true)}>+ Lançamento</button>}
                  </div>

                  {showPartAForm && (
                    <form onSubmit={addPartA} className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-200">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div>
                          <label className={lbl}>Natureza *</label>
                          <select className="input" value={partAForm.nature} onChange={e => setPartAForm(f => ({ ...f, nature: e.target.value }))}>
                            <option value="ADICAO">Adição</option>
                            <option value="EXCLUSAO">Exclusão</option>
                            <option value="COMPENSACAO">Compensação</option>
                          </select>
                        </div>
                        <div>
                          <label className={lbl}>Tipo</label>
                          <select className="input" value={partAForm.timing} onChange={e => setPartAForm(f => ({ ...f, timing: e.target.value }))}>
                            <option value="PERMANENTE">Permanente</option>
                            <option value="TEMPORARIA">Temporária</option>
                          </select>
                        </div>
                        <div>
                          <label className={lbl}>Valor (R$) *</label>
                          <input className="input" type="number" step="0.01" required value={partAForm.value} onChange={e => setPartAForm(f => ({ ...f, value: e.target.value }))} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={lbl}>Descrição *</label>
                          <input className="input" required value={partAForm.description} onChange={e => setPartAForm(f => ({ ...f, description: e.target.value }))} />
                        </div>
                        <div>
                          <label className={lbl}>Conta Contábil</label>
                          <input className="input" value={partAForm.accountCode} onChange={e => setPartAForm(f => ({ ...f, accountCode: e.target.value }))} />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button type="button" className={btnSec} onClick={() => setShowPartAForm(false)}>Cancelar</button>
                        <button type="submit" className={btn}>Salvar</button>
                      </div>
                    </form>
                  )}

                  <DataTable headers={['#', 'Natureza', 'Tipo', 'Descrição', 'Conta', 'Valor', '']}>
                    {(period.partAEntries ?? []).length === 0 ? (
                      <tr><td colSpan={7} className="py-8 text-center text-sm text-slate-400">Nenhum lançamento.</td></tr>
                    ) : (period.partAEntries ?? []).map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm text-slate-500">{r.sequence}</td>
                        <td className="px-4 py-3"><span className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${NATURE_COLOR[r.nature]}`}>{NATURE_LABEL[r.nature]}</span></td>
                        <td className="px-4 py-3 text-sm text-slate-600">{r.timing === 'TEMPORARIA' ? 'Temporária' : 'Permanente'}</td>
                        <td className="px-4 py-3 text-sm text-slate-900">{r.description}</td>
                        <td className="px-4 py-3 text-sm text-slate-500 font-mono">{r.accountCode || '—'}</td>
                        <td className="px-4 py-3 text-sm font-medium">{fmt(r.value)}</td>
                        <td className="px-4 py-3">
                          {!isLocked && (
                            <button className="text-rose-500 hover:text-rose-700 text-sm" onClick={async () => { if (confirm('Excluir?')) { await svc.deletePartA(r.id, clientId); loadPeriod(); } }}>Excluir</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </DataTable>

                  {/* Totalizadores */}
                  {(period.partAEntries ?? []).length > 0 && (
                    <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                      {[
                        { label: 'Total Adições', value: period.totalAdditions, color: 'text-red-600' },
                        { label: 'Total Exclusões', value: period.totalExclusions, color: 'text-green-600' },
                        { label: 'Total Compensações', value: period.totalCompensations, color: 'text-yellow-600' },
                      ].map(s => (
                        <div key={s.label} className="text-right">
                          <span className="text-xs text-slate-500">{s.label}: </span>
                          <span className={`text-sm font-bold ${s.color}`}>{fmt(s.value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── PARTE B ── */}
              {tab === 'parteB' && !selectedBalance && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-slate-900">Controle de Saldos — Diferenças Temporárias</h3>
                    {!isLocked && <button className={btn} onClick={() => setShowPartBForm(true)}>+ Saldo</button>}
                  </div>

                  {showPartBForm && (
                    <form onSubmit={addPartB} className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-200">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div>
                          <label className={lbl}>Tipo</label>
                          <select className="input" value={partBForm.type} onChange={e => setPartBForm(f => ({ ...f, type: e.target.value }))}>
                            <option value="TRIBUTACAO_FUTURA">Tributação Futura</option>
                            <option value="DEDUCAO_FUTURA">Dedução Futura</option>
                          </select>
                        </div>
                        <div>
                          <label className={lbl}>Controle</label>
                          <select className="input" value={partBForm.controlType} onChange={e => setPartBForm(f => ({ ...f, controlType: e.target.value }))}>
                            {Object.entries(CONTROL_TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={lbl}>Data de Origem</label>
                          <input className="input" type="date" value={partBForm.originDate} onChange={e => setPartBForm(f => ({ ...f, originDate: e.target.value }))} />
                        </div>
                        <div>
                          <label className={lbl}>Valor Original (R$)</label>
                          <input className="input" type="number" step="0.01" value={partBForm.originalValue} onChange={e => setPartBForm(f => ({ ...f, originalValue: e.target.value }))} />
                        </div>
                        <div>
                          <label className={lbl}>Saldo Inicial</label>
                          <input className="input" type="number" step="0.01" value={partBForm.openingBalance} onChange={e => setPartBForm(f => ({ ...f, openingBalance: e.target.value }))} />
                        </div>
                        <div>
                          <label className={lbl}>Adições</label>
                          <input className="input" type="number" step="0.01" value={partBForm.additions} onChange={e => setPartBForm(f => ({ ...f, additions: e.target.value }))} />
                        </div>
                        <div>
                          <label className={lbl}>Realizações</label>
                          <input className="input" type="number" step="0.01" value={partBForm.realizations} onChange={e => setPartBForm(f => ({ ...f, realizations: e.target.value }))} />
                        </div>
                      </div>
                      <div>
                        <label className={lbl}>Descrição *</label>
                        <input className="input" required value={partBForm.description} onChange={e => setPartBForm(f => ({ ...f, description: e.target.value }))} />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button type="button" className={btnSec} onClick={() => setShowPartBForm(false)}>Cancelar</button>
                        <button type="submit" className={btn}>Salvar</button>
                      </div>
                    </form>
                  )}

                  <DataTable headers={['Descrição', 'Controle', 'Tipo', 'Saldo Inicial', 'Adições', 'Realizações', 'Saldo Final', '']}>
                    {(period.partBBalances ?? []).length === 0 ? (
                      <tr><td colSpan={8} className="py-8 text-center text-sm text-slate-400">Nenhum saldo cadastrado.</td></tr>
                    ) : (period.partBBalances ?? []).map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm text-slate-900">{r.description}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{CONTROL_TYPE_LABEL[r.controlType] ?? r.controlType}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">{r.type === 'TRIBUTACAO_FUTURA' ? 'Trib. Futura' : 'Ded. Futura'}</td>
                        <td className="px-4 py-3 text-sm">{fmt(r.openingBalance)}</td>
                        <td className="px-4 py-3 text-sm text-sky-600">{fmt(r.additions)}</td>
                        <td className="px-4 py-3 text-sm text-green-600">{fmt(r.realizations)}</td>
                        <td className="px-4 py-3 text-sm font-bold">{fmt(r.closingBalance)}</td>
                        <td className="px-4 py-3">
                          <button className="text-sky-600 hover:underline text-sm" onClick={() => setSelectedBalance(r)}>Movimentos</button>
                        </td>
                      </tr>
                    ))}
                  </DataTable>
                </div>
              )}

              {/* Detalhe de um saldo — histórico de movimentações */}
              {tab === 'parteB' && selectedBalance && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <button className={btnSec} onClick={() => setSelectedBalance(null)}>← Voltar</button>
                    <div>
                      <h3 className="font-medium text-slate-900">{selectedBalance.description}</h3>
                      <p className="text-xs text-slate-500">{CONTROL_TYPE_LABEL[selectedBalance.controlType]} · Saldo: {fmt(selectedBalance.closingBalance)}</p>
                    </div>
                    {!isLocked && <button className={btn + ' ml-auto'} onClick={() => setShowMovForm(true)}>+ Movimentação</button>}
                  </div>

                  {/* Cards do saldo */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Valor Original', value: selectedBalance.originalValue, color: 'text-slate-700' },
                      { label: 'Valor Utilizado', value: selectedBalance.usedValue, color: 'text-green-600' },
                      { label: 'Saldo Remanescente', value: selectedBalance.closingBalance, color: 'text-sky-700' },
                    ].map(s => (
                      <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
                        <p className="text-xs text-slate-500">{s.label}</p>
                        <p className={`text-base font-bold mt-1 ${s.color}`}>{fmt(s.value)}</p>
                      </div>
                    ))}
                  </div>

                  {showMovForm && (
                    <form onSubmit={addMovement} className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-200">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className={lbl}>Tipo *</label>
                          <select className="input" value={movForm.type} onChange={e => setMovForm(f => ({ ...f, type: e.target.value }))}>
                            <option value="INCLUSAO">Inclusão</option>
                            <option value="UTILIZACAO">Utilização</option>
                            <option value="BAIXA">Baixa</option>
                            <option value="TRANSFERENCIA">Transferência</option>
                          </select>
                        </div>
                        <div>
                          <label className={lbl}>Valor (R$) *</label>
                          <input className="input" type="number" step="0.01" required value={movForm.value} onChange={e => setMovForm(f => ({ ...f, value: e.target.value }))} />
                        </div>
                        <div>
                          <label className={lbl}>Data *</label>
                          <input className="input" type="date" required value={movForm.movementDate} onChange={e => setMovForm(f => ({ ...f, movementDate: e.target.value }))} />
                        </div>
                        <div>
                          <label className={lbl}>Doc. Referência</label>
                          <input className="input" value={movForm.documentRef} onChange={e => setMovForm(f => ({ ...f, documentRef: e.target.value }))} />
                        </div>
                      </div>
                      <div>
                        <label className={lbl}>Histórico *</label>
                        <input className="input" required value={movForm.description} onChange={e => setMovForm(f => ({ ...f, description: e.target.value }))} />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button type="button" className={btnSec} onClick={() => setShowMovForm(false)}>Cancelar</button>
                        <button type="submit" className={btn}>Salvar</button>
                      </div>
                    </form>
                  )}

                  <DataTable headers={['Data', 'Tipo', 'Histórico', 'Doc. Ref.', 'Valor']}>
                    {(selectedBalance.movements ?? []).length === 0 ? (
                      <tr><td colSpan={5} className="py-8 text-center text-sm text-slate-400">Nenhuma movimentação.</td></tr>
                    ) : (selectedBalance.movements ?? []).map((m: any) => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm">{new Date(m.movementDate).toLocaleDateString('pt-BR')}</td>
                        <td className="px-4 py-3"><span className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${MOV_TYPE_COLOR[m.type]}`}>{MOV_TYPE_LABEL[m.type]}</span></td>
                        <td className="px-4 py-3 text-sm text-slate-900">{m.description}</td>
                        <td className="px-4 py-3 text-sm text-slate-500 font-mono">{m.documentRef || '—'}</td>
                        <td className="px-4 py-3 text-sm font-medium">{fmt(m.value)}</td>
                      </tr>
                    ))}
                  </DataTable>
                </div>
              )}

              {/* ── COMPENSAÇÕES ── */}
              {tab === 'compensacoes' && (
                <div className="space-y-6">
                  <h3 className="font-medium text-slate-900">Compensações — Prejuízo Fiscal e Base Negativa</h3>

                  {compensationLimit && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Lucro Real', value: compensationLimit.realProfit, color: 'text-sky-700' },
                        { label: 'Limite 30% IRPJ', value: compensationLimit.irpjLimit, color: 'text-amber-600' },
                        { label: 'Disponível IRPJ', value: compensationLimit.irpjAvailable, color: 'text-slate-700' },
                        { label: 'Sugerido IRPJ', value: compensationLimit.irpjSuggested, color: 'text-green-600' },
                        { label: 'Base CSLL', value: compensationLimit.csllBase, color: 'text-sky-700' },
                        { label: 'Limite 30% CSLL', value: compensationLimit.csllLimit, color: 'text-amber-600' },
                        { label: 'Disponível CSLL', value: compensationLimit.csllAvailable, color: 'text-slate-700' },
                        { label: 'Sugerido CSLL', value: compensationLimit.csllSuggested, color: 'text-green-600' },
                      ].map(s => (
                        <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
                          <p className="text-xs text-slate-500">{s.label}</p>
                          <p className={`text-sm font-bold mt-1 ${s.color}`}>{fmt(s.value)}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {!isLocked && compensationLimit && (
                    <form onSubmit={doApplyCompensation} className="rounded-2xl border border-sky-200 bg-sky-50 p-4 space-y-3">
                      <h4 className="font-medium text-sky-900">Aplicar Compensação no Período {year}</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={lbl}>Valor IRPJ a compensar (R$)</label>
                          <input className="input" type="number" step="0.01" value={applyForm.irpjAmount}
                            onChange={e => setApplyForm(f => ({ ...f, irpjAmount: e.target.value }))} />
                          <p className="text-xs text-slate-400 mt-1">Máximo: {fmt(compensationLimit.irpjSuggested)}</p>
                        </div>
                        <div>
                          <label className={lbl}>Valor CSLL a compensar (R$)</label>
                          <input className="input" type="number" step="0.01" value={applyForm.csllAmount}
                            onChange={e => setApplyForm(f => ({ ...f, csllAmount: e.target.value }))} />
                          <p className="text-xs text-slate-400 mt-1">Máximo: {fmt(compensationLimit.csllSuggested)}</p>
                        </div>
                      </div>
                      <button type="submit" className={btn}>Aplicar Compensação</button>
                    </form>
                  )}

                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-slate-700">Saldos Disponíveis por Ano</h4>
                    {!isLocked && <button className={btnSec} onClick={() => setShowCompForm(!showCompForm)}>+ Registrar Saldo</button>}
                  </div>

                  {showCompForm && (
                    <form onSubmit={addCompensation} className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-200">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className={lbl}>Ano de Origem *</label>
                          <input className="input" type="number" required value={compForm.originYear} onChange={e => setCompForm(f => ({ ...f, originYear: e.target.value }))} />
                        </div>
                        <div>
                          <label className={lbl}>Tipo *</label>
                          <select className="input" value={compForm.type} onChange={e => setCompForm(f => ({ ...f, type: e.target.value }))}>
                            <option value="PREJUIZO_FISCAL">Prejuízo Fiscal</option>
                            <option value="BASE_NEGATIVA_CSLL">Base Negativa CSLL</option>
                            <option value="INCENTIVO_FISCAL">Incentivo Fiscal</option>
                          </select>
                        </div>
                        <div>
                          <label className={lbl}>Valor Original (R$) *</label>
                          <input className="input" type="number" step="0.01" required value={compForm.originalValue} onChange={e => setCompForm(f => ({ ...f, originalValue: e.target.value }))} />
                        </div>
                        <div>
                          <label className={lbl}>Observações</label>
                          <input className="input" value={compForm.notes} onChange={e => setCompForm(f => ({ ...f, notes: e.target.value }))} />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button type="button" className={btnSec} onClick={() => setShowCompForm(false)}>Cancelar</button>
                        <button type="submit" className={btn}>Salvar</button>
                      </div>
                    </form>
                  )}

                  <DataTable headers={['Ano Origem', 'Tipo', 'Valor Original', 'Utilizado', 'Saldo', 'Usado em']}>
                    {((compensationLimit?.availableIrpj ?? []).concat(compensationLimit?.availableCsll ?? [])).length === 0 ? (
                      <tr><td colSpan={6} className="py-8 text-center text-sm text-slate-400">Nenhum saldo de compensação.</td></tr>
                    ) : ((compensationLimit?.availableIrpj ?? []).concat(compensationLimit?.availableCsll ?? [])).map((c: any) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium">{c.originYear}</td>
                        <td className="px-4 py-3 text-sm">{c.type === 'PREJUIZO_FISCAL' ? 'Prejuízo Fiscal' : 'Base Neg. CSLL'}</td>
                        <td className="px-4 py-3 text-sm">{fmt(c.originalValue)}</td>
                        <td className="px-4 py-3 text-sm text-green-600">{fmt(c.usedValue)}</td>
                        <td className="px-4 py-3 text-sm font-bold text-sky-700">{fmt(c.remainingValue)}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">{c.usedInYear ?? '—'}</td>
                      </tr>
                    ))}
                  </DataTable>
                </div>
              )}

              {/* ── IRPJ/CSLL ── */}
              {tab === 'irpj' && (
                <div className="space-y-6">
                  <h3 className="font-medium text-slate-900">Cálculo IRPJ e CSLL — Lucro Real {year}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                      { label: 'Alíquota IRPJ (%)', key: 'irpjRate' },
                      { label: 'Adicional IRPJ (%)', key: 'irpjSurchargeRate' },
                      { label: 'Alíquota CSLL (%)', key: 'csllRate' },
                      { label: 'Incentivos IRPJ (R$)', key: 'irpjIncentives' },
                      { label: 'Incentivos CSLL (R$)', key: 'csllIncentives' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className={lbl}>{f.label}</label>
                        <input className="input" type="number" value={(irpjForm as any)[f.key]} onChange={e => setIrpjForm(p => ({ ...p, [f.key]: e.target.value }))} />
                      </div>
                    ))}
                  </div>
                  <button className={btn} onClick={doCalcIrpj} disabled={isLocked}>Calcular</button>

                  {period.irpjCsllCalc && (
                    <>
                      <h4 className="font-medium text-slate-700 border-t border-slate-200 pt-4">Resultado do Cálculo</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { label: 'Base IRPJ', value: period.irpjCsllCalc.irpjBase },
                          { label: 'IRPJ (alíquota normal)', value: period.irpjCsllCalc.irpjValue },
                          { label: `Adicional IRPJ (base acima de R$ 20.000/mês)`, value: period.irpjCsllCalc.irpjSurchargeValue, color: 'text-orange-600' },
                          { label: 'IRPJ Total', value: period.irpjCsllCalc.irpjTotal, color: 'text-red-600 font-bold' },
                          { label: 'Base CSLL', value: period.irpjCsllCalc.csllBase },
                          { label: 'CSLL (9%)', value: period.irpjCsllCalc.csllValue },
                          { label: 'IRPJ Líquido (após incentivos)', value: period.irpjCsllCalc.irpjNet, color: 'text-red-700 font-bold' },
                          { label: 'CSLL Líquida (após incentivos)', value: period.irpjCsllCalc.csllNet, color: 'text-red-700 font-bold' },
                        ].map(s => (
                          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
                            <p className="text-xs text-slate-500">{s.label}</p>
                            <p className={`text-base font-medium mt-1 ${s.color ?? 'text-slate-900'}`}>{fmt(s.value)}</p>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                        <p className="text-sm font-medium text-slate-700">Total IRPJ + CSLL: <span className="text-red-700 font-bold">{fmt(Number(period.irpjCsllCalc.irpjNet) + Number(period.irpjCsllCalc.csllNet))}</span></p>
                        {period.irpjCsllCalc.calculatedAt && <p className="text-xs text-slate-400 mt-1">Calculado em {new Date(period.irpjCsllCalc.calculatedAt).toLocaleString('pt-BR')}</p>}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── ECF ── */}
              {tab === 'ecf' && (
                <div className="space-y-4">
                  <h3 className="font-medium text-slate-900">Geração da ECF — Ano {year}</h3>
                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600 space-y-1">
                    <p><strong>Registros gerados:</strong></p>
                    <ul className="list-disc list-inside ml-2 space-y-1">
                      <li>M300/M305 — Adições ao lucro (Parte A)</li>
                      <li>M350/M355 — Exclusões do lucro (Parte A)</li>
                      <li>M380 — Compensações aplicadas</li>
                      <li>M390 — Lucro Real apurado</li>
                      <li>M410 — Saldos da Parte B (diferenças temporárias)</li>
                      <li>M500 — IRPJ: base, alíquota, adicional, incentivos, líquido</li>
                      <li>M510 — CSLL: base, alíquota, incentivos, líquido</li>
                      <li>K100 — Saldos da Parte B para bloco K</li>
                    </ul>
                  </div>
                  <div className="flex gap-3">
                    <button className={btn} onClick={async () => {
                      try { await svc.generateEcf(year, clientId); alert('ECF gerada com sucesso!'); }
                      catch (e: any) { alert('Erro: ' + (e?.response?.data?.error ?? e.message)); }
                    }}>Gerar ECF</button>
                    <a href={svc.downloadEcfUrl(year, clientId)} download className={btnSec}>Download ECF</a>
                  </div>
                </div>
              )}

              {/* ── PARÂMETROS ── */}
              {tab === 'parametros' && (
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="font-medium text-slate-900">Regras de Integração Contábil</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Conta contábil → ajuste automático na Parte A ao importar resultado</p>
                      </div>
                      <button className={btn} onClick={() => setShowRuleForm(!showRuleForm)}>+ Regra</button>
                    </div>

                    {showRuleForm && (
                      <form onSubmit={addRule} className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-200 mb-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className={lbl}>Conta Contábil *</label>
                            <input className="input font-mono" required value={ruleForm.accountCode} onChange={e => setRuleForm(f => ({ ...f, accountCode: e.target.value }))} />
                          </div>
                          <div>
                            <label className={lbl}>Natureza *</label>
                            <select className="input" value={ruleForm.nature} onChange={e => setRuleForm(f => ({ ...f, nature: e.target.value }))}>
                              <option value="ADICAO">Adição</option>
                              <option value="EXCLUSAO">Exclusão</option>
                            </select>
                          </div>
                          <div>
                            <label className={lbl}>Tipo de Ajuste</label>
                            <select className="input" value={ruleForm.adjustTypeId} onChange={e => setRuleForm(f => ({ ...f, adjustTypeId: e.target.value }))}>
                              <option value="">— Nenhum —</option>
                              {adjustTypes.map((a: any) => <option key={a.id} value={a.id}>{a.code} — {a.description}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className={lbl}>Descrição *</label>
                            <input className="input" required value={ruleForm.description} onChange={e => setRuleForm(f => ({ ...f, description: e.target.value }))} />
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button type="button" className={btnSec} onClick={() => setShowRuleForm(false)}>Cancelar</button>
                          <button type="submit" className={btn}>Salvar</button>
                        </div>
                      </form>
                    )}

                    <DataTable headers={['Conta', 'Natureza', 'Tipo de Ajuste', 'Descrição', 'Ativo', '']}>
                      {rules.length === 0 ? (
                        <tr><td colSpan={6} className="py-8 text-center text-sm text-slate-400">Nenhuma regra configurada.</td></tr>
                      ) : rules.map((r: any) => (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm font-mono">{r.accountCode}</td>
                          <td className="px-4 py-3"><span className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${NATURE_COLOR[r.nature]}`}>{NATURE_LABEL[r.nature]}</span></td>
                          <td className="px-4 py-3 text-sm text-slate-600">{r.adjustType ? `${r.adjustType.code} — ${r.adjustType.description}` : '—'}</td>
                          <td className="px-4 py-3 text-sm text-slate-900">{r.description}</td>
                          <td className="px-4 py-3"><span className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${r.active ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{r.active ? 'Sim' : 'Não'}</span></td>
                          <td className="px-4 py-3">
                            <button className="text-rose-500 hover:text-rose-700 text-sm" onClick={async () => { if (confirm('Excluir?')) { await svc.deleteAccountingRule(r.id, clientId); svc.listAccountingRules(clientId).then(setRules); } }}>Excluir</button>
                          </td>
                        </tr>
                      ))}
                    </DataTable>
                  </div>

                  <div className="border-t border-slate-200 pt-4">
                    <h3 className="font-medium text-slate-900 mb-1">Tipos de Ajuste Cadastrados</h3>
                    <p className="text-xs text-slate-500 mb-3">Adições, exclusões e compensações da Parte A com código referencial da ECF</p>
                    <DataTable headers={['Código', 'Natureza', 'Tipo', 'Conta', 'Cód. ECF', 'Descrição', 'Ativo']}>
                      {adjustTypes.length === 0 ? (
                        <tr><td colSpan={7} className="py-8 text-center text-sm text-slate-400">Nenhum tipo cadastrado.</td></tr>
                      ) : adjustTypes.map((a: any) => (
                        <tr key={a.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm font-mono">{a.code}</td>
                          <td className="px-4 py-3"><span className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${NATURE_COLOR[a.nature]}`}>{NATURE_LABEL[a.nature]}</span></td>
                          <td className="px-4 py-3 text-sm text-slate-600">{a.timing === 'TEMPORARIA' ? 'Temporária' : 'Permanente'}</td>
                          <td className="px-4 py-3 text-sm font-mono text-slate-500">{a.accountCode || '—'}</td>
                          <td className="px-4 py-3 text-sm font-mono text-slate-500">{a.ecfRefCode || '—'}</td>
                          <td className="px-4 py-3 text-sm text-slate-900">{a.description}</td>
                          <td className="px-4 py-3"><span className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${a.active ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{a.active ? 'Sim' : 'Não'}</span></td>
                        </tr>
                      ))}
                    </DataTable>
                  </div>
                </div>
              )}

              {/* ── AUDITORIA ── */}
              {tab === 'auditoria' && (
                <div className="space-y-4">
                  <h3 className="font-medium text-slate-900">Histórico de Alterações — Período {year}</h3>
                  <DataTable headers={['Data/Hora', 'Ação', 'Entidade', 'Usuário', 'Antes', 'Depois']}>
                    {auditLogs.length === 0 ? (
                      <tr><td colSpan={6} className="py-8 text-center text-sm text-slate-400">Nenhum registro de auditoria.</td></tr>
                    ) : auditLogs.map((l: any) => (
                      <tr key={l.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm text-slate-500">{new Date(l.createdAt).toLocaleString('pt-BR')}</td>
                        <td className="px-4 py-3"><span className="inline-flex rounded-lg px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700">{ACTION_LABEL[l.action] ?? l.action}</span></td>
                        <td className="px-4 py-3 text-sm text-slate-600">{l.entity}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{l.user?.name ?? '—'}</td>
                        <td className="px-4 py-3 text-xs text-slate-400 max-w-32 truncate" title={l.before ?? ''}>{l.before ? l.before.substring(0, 50) + '...' : '—'}</td>
                        <td className="px-4 py-3 text-xs text-slate-400 max-w-32 truncate" title={l.after ?? ''}>{l.after ? l.after.substring(0, 50) + '...' : '—'}</td>
                      </tr>
                    ))}
                  </DataTable>
                </div>
              )}

            </div>
          </div>
        </>
      )}
    </div>
  );
}
