import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import * as svc from '../../services/patrimonyService';

const fmt = (v: any) => Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
const lbl = 'block text-xs font-medium text-slate-500 mb-1';
const btn = 'rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600';
const btnSec = 'rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50';
const btnDanger = 'rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600';

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-900 mt-0.5">{value ?? '—'}</p>
    </div>
  );
}

export function PatrimonyAssetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<any>(null);
  const [tab, setTab] = useState<'info' | 'deprec' | 'mov' | 'reav' | 'baixa'>('info');

  const [showMovForm, setShowMovForm] = useState(false);
  const [movForm, setMovForm] = useState({ type: 'TRANSFERENCIA_LOCAL', movementDate: '', toStatus: '', reason: '' });

  const [showReavForm, setShowReavForm] = useState(false);
  const [reavForm, setReavForm] = useState({ type: 'REAVALIACAO', revaluationDate: '', newValue: '', notes: '' });

  const [showBaixaForm, setShowBaixaForm] = useState(false);
  const [baixaForm, setBaixaForm] = useState({ type: 'SUCATEAMENTO', disposalDate: '', saleValue: '0', notes: '' });

  useEffect(() => { if (id) load(); }, [id]);
  async function load() { setAsset(await svc.getAsset(id!)); }

  async function submitMov(e: React.FormEvent) {
    e.preventDefault();
    await svc.createMovement(id!, asset.clientId, { ...movForm, movementDate: new Date(movForm.movementDate), toStatus: movForm.toStatus || undefined });
    setShowMovForm(false);
    load();
  }

  async function submitReav(e: React.FormEvent) {
    e.preventDefault();
    await svc.createRevaluation(id!, asset.clientId, { ...reavForm, revaluationDate: new Date(reavForm.revaluationDate), newValue: Number(reavForm.newValue) });
    setShowReavForm(false);
    load();
  }

  async function submitBaixa(e: React.FormEvent) {
    e.preventDefault();
    if (!confirm('Confirmar baixa do bem? Esta ação é irreversível.')) return;
    await svc.createDisposal(id!, asset.clientId, { ...baixaForm, disposalDate: new Date(baixaForm.disposalDate), saleValue: Number(baixaForm.saleValue) });
    navigate('/patrimonio/bens');
  }

  if (!asset) return <div className="p-8 text-center text-slate-400">Carregando...</div>;

  const tabs = [
    { key: 'info', label: 'Dados Gerais' },
    { key: 'deprec', label: 'Depreciação' },
    { key: 'mov', label: 'Movimentações' },
    { key: 'reav', label: 'Reavaliação' },
    { key: 'baixa', label: 'Baixa' },
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${asset.tombamento} — ${asset.description}`}
        description={asset.group?.name ?? 'Bem Patrimonial'}
        action={<Link to={`/patrimonio/bens/${id}/editar`} className={btnSec}>Editar</Link>}
      />

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 flex gap-0 px-2 pt-2">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t.key ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'info' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <Info label="Tombamento" value={asset.tombamento} />
              <Info label="Código Interno" value={asset.internalCode} />
              <Info label="Nº de Série" value={asset.serialNumber} />
              <Info label="Status" value={asset.status} />
              <Info label="Marca" value={asset.brand} />
              <Info label="Modelo" value={asset.model} />
              <Info label="Fabricante" value={asset.manufacturer} />
              <Info label="Tipo Aquisição" value={asset.acquisitionType} />
              <Info label="Grupo" value={asset.group?.name} />
              <Info label="Localização" value={asset.location?.name} />
              <Info label="Responsável" value={asset.responsible?.name} />
              <Info label="Data Aquisição" value={fmtDate(asset.acquisitionDate)} />
              <Info label="Valor de Aquisição" value={fmt(asset.acquisitionValue)} />
              <Info label="Valor Residual" value={fmt(asset.residualValue)} />
              <Info label="Vida Útil (meses)" value={asset.usefulLifeMonths} />
              <Info label="Método Depreciação" value={asset.deprecMethod} />
              <Info label="Conta Ativo" value={asset.assetAccountCode} />
              <Info label="Depr. Acumulada" value={asset.accumDeprecAccountCode} />
              <Info label="Despesa Depr." value={asset.deprecExpenseAccountCode} />
            </div>
          )}

          {tab === 'deprec' && (
            <DataTable headers={['Período', 'Valor Inicial', 'Depr. Mensal', 'Depr. Acum.', 'Valor Líquido', 'Depr. Fiscal']}>
              {(asset.depreciations ?? []).length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-sm text-slate-400">Nenhuma depreciação calculada.</td></tr>
              ) : (asset.depreciations ?? []).map((r: any) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm">{String(r.periodMonth).padStart(2,'0')}/{r.periodYear}</td>
                  <td className="px-4 py-3 text-sm">{fmt(r.openingValue)}</td>
                  <td className="px-4 py-3 text-sm">{fmt(r.monthlyDeprec)}</td>
                  <td className="px-4 py-3 text-sm">{fmt(r.accumDeprecClose)}</td>
                  <td className="px-4 py-3 text-sm font-bold">{fmt(r.closingValue)}</td>
                  <td className="px-4 py-3 text-sm">{fmt(r.fiscalDeprec)}</td>
                </tr>
              ))}
            </DataTable>
          )}

          {tab === 'mov' && (
            <div className="space-y-4">
              <button className={btn} onClick={() => setShowMovForm(true)}>+ Movimentação</button>
              {showMovForm && (
                <form onSubmit={submitMov} className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div><label className={lbl}>Tipo</label>
                      <select className="input" value={movForm.type} onChange={e => setMovForm(f => ({ ...f, type: e.target.value }))}>
                        <option value="TRANSFERENCIA_LOCAL">Transferência de Local</option>
                        <option value="TRANSFERENCIA_RESPONSAVEL">Transferência de Responsável</option>
                        <option value="MUDANCA_STATUS">Mudança de Status</option>
                      </select></div>
                    <div><label className={lbl}>Data *</label><input className="input" type="date" value={movForm.movementDate} onChange={e => setMovForm(f => ({ ...f, movementDate: e.target.value }))} required /></div>
                    <div><label className={lbl}>Novo Status</label>
                      <select className="input" value={movForm.toStatus} onChange={e => setMovForm(f => ({ ...f, toStatus: e.target.value }))}>
                        <option value="">— manter —</option>
                        {['ATIVO','EM_MANUTENCAO','OCIOSO','ARRENDADO','CEDIDO'].map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
                      </select></div>
                    <div><label className={lbl}>Motivo</label><input className="input" value={movForm.reason} onChange={e => setMovForm(f => ({ ...f, reason: e.target.value }))} /></div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button type="button" className={btnSec} onClick={() => setShowMovForm(false)}>Cancelar</button>
                    <button type="submit" className={btn}>Registrar</button>
                  </div>
                </form>
              )}
              <DataTable headers={['Data', 'Tipo', 'Novo Status', 'Motivo']}>
                {(asset.movements ?? []).length === 0 ? (
                  <tr><td colSpan={4} className="py-6 text-center text-sm text-slate-400">Sem movimentações.</td></tr>
                ) : (asset.movements ?? []).map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm">{fmtDate(r.movementDate)}</td>
                    <td className="px-4 py-3 text-sm">{r.type.replace(/_/g,' ')}</td>
                    <td className="px-4 py-3 text-sm">{r.toStatus ?? '—'}</td>
                    <td className="px-4 py-3 text-sm">{r.reason ?? '—'}</td>
                  </tr>
                ))}
              </DataTable>
            </div>
          )}

          {tab === 'reav' && (
            <div className="space-y-4">
              <button className={btn} onClick={() => setShowReavForm(true)}>+ Reavaliação / Impairment</button>
              {showReavForm && (
                <form onSubmit={submitReav} className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div><label className={lbl}>Tipo</label>
                      <select className="input" value={reavForm.type} onChange={e => setReavForm(f => ({ ...f, type: e.target.value }))}>
                        <option value="REAVALIACAO">Reavaliação</option>
                        <option value="IMPAIRMENT">Impairment</option>
                        <option value="REVERSAO_IMPAIRMENT">Reversão de Impairment</option>
                      </select></div>
                    <div><label className={lbl}>Data *</label><input className="input" type="date" value={reavForm.revaluationDate} onChange={e => setReavForm(f => ({ ...f, revaluationDate: e.target.value }))} required /></div>
                    <div><label className={lbl}>Novo Valor (R$) *</label><input className="input" type="number" step="0.01" value={reavForm.newValue} onChange={e => setReavForm(f => ({ ...f, newValue: e.target.value }))} required /></div>
                    <div><label className={lbl}>Notas</label><input className="input" value={reavForm.notes} onChange={e => setReavForm(f => ({ ...f, notes: e.target.value }))} /></div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button type="button" className={btnSec} onClick={() => setShowReavForm(false)}>Cancelar</button>
                    <button type="submit" className={btn}>Registrar</button>
                  </div>
                </form>
              )}
              <DataTable headers={['Data', 'Tipo', 'Valor Anterior', 'Novo Valor', 'Ajuste']}>
                {(asset.revaluations ?? []).length === 0 ? (
                  <tr><td colSpan={5} className="py-6 text-center text-sm text-slate-400">Sem reavaliações.</td></tr>
                ) : (asset.revaluations ?? []).map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm">{fmtDate(r.revaluationDate)}</td>
                    <td className="px-4 py-3 text-sm">{r.type}</td>
                    <td className="px-4 py-3 text-sm">{fmt(r.previousValue)}</td>
                    <td className="px-4 py-3 text-sm">{fmt(r.newValue)}</td>
                    <td className={`px-4 py-3 text-sm font-medium ${Number(r.adjustment) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(r.adjustment)}</td>
                  </tr>
                ))}
              </DataTable>
            </div>
          )}

          {tab === 'baixa' && (
            <div className="space-y-4">
              {asset.status !== 'BAIXADO' ? (
                <>
                  <button className={btnDanger} onClick={() => setShowBaixaForm(true)}>Registrar Baixa do Bem</button>
                  {showBaixaForm && (
                    <form onSubmit={submitBaixa} className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-3">
                      <p className="text-sm font-medium text-rose-700">Atenção: a baixa é irreversível e o bem será marcado como inativo.</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div><label className={lbl}>Tipo de Baixa</label>
                          <select className="input" value={baixaForm.type} onChange={e => setBaixaForm(f => ({ ...f, type: e.target.value }))}>
                            <option value="VENDA">Venda</option>
                            <option value="SUCATEAMENTO">Sucateamento</option>
                            <option value="PERDA_ROUBO">Perda / Roubo</option>
                            <option value="DOACAO">Doação</option>
                            <option value="TRANSFERENCIA">Transferência</option>
                            <option value="OBSOLESCENCIA">Obsolescência</option>
                          </select></div>
                        <div><label className={lbl}>Data da Baixa *</label><input className="input" type="date" value={baixaForm.disposalDate} onChange={e => setBaixaForm(f => ({ ...f, disposalDate: e.target.value }))} required /></div>
                        <div><label className={lbl}>Valor de Venda (R$)</label><input className="input" type="number" step="0.01" value={baixaForm.saleValue} onChange={e => setBaixaForm(f => ({ ...f, saleValue: e.target.value }))} /></div>
                        <div><label className={lbl}>Notas</label><input className="input" value={baixaForm.notes} onChange={e => setBaixaForm(f => ({ ...f, notes: e.target.value }))} /></div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button type="button" className={btnSec} onClick={() => setShowBaixaForm(false)}>Cancelar</button>
                        <button type="submit" className={btnDanger}>Confirmar Baixa</button>
                      </div>
                    </form>
                  )}
                </>
              ) : (
                <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">Bem baixado em {fmtDate(asset.disposals?.[0]?.disposalDate)}.</div>
              )}
              {(asset.disposals ?? []).map((d: any) => (
                <div key={d.id} className="rounded-2xl border border-slate-200 p-4 grid grid-cols-2 md:grid-cols-5 gap-3">
                  <Info label="Tipo" value={d.type} />
                  <Info label="Data" value={fmtDate(d.disposalDate)} />
                  <Info label="Valor Contábil" value={fmt(d.bookValue)} />
                  <Info label="Valor Venda" value={fmt(d.saleValue)} />
                  <Info label="Ganho / Perda" value={<span className={Number(d.gainLoss) >= 0 ? 'text-green-600' : 'text-red-600'}>{fmt(d.gainLoss)}</span>} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
