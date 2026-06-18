import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../../components/PageHeader';
import {
  fetchCostCenters, createCostCenterApi, updateCostCenterApi, deleteCostCenterApi,
  fetchStandardHistories, createStandardHistoryApi, updateStandardHistoryApi, deleteStandardHistoryApi,
  fetchEntryTypes, createEntryTypeApi, updateEntryTypeApi, deleteEntryTypeApi,
} from '../../services/accountingService';
import type { CostCenter, StandardHistory, EntryType, CostCenterType, EntryTypeClass } from '../../types';

const CC_TYPE_LABELS: Record<CostCenterType, string> = {
  ADMINISTRATIVO: 'Administrativo', OPERACIONAL: 'Operacional', PROJETO: 'Projeto', UNIDADE: 'Unidade',
};

const ET_CLASS_LABELS: Record<EntryTypeClass, string> = {
  NORMAL: 'Normal', PROVISAO: 'Provisão', RECLASSIFICACAO: 'Reclassificação',
  ENCERRAMENTO: 'Encerramento', AJUSTE: 'Ajuste',
};

type Tab = 'centros' | 'historicos' | 'tipos';

function Badge({ label, color }: { label: string; color: string }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>{label}</span>;
}

export function AccountingCadastrosPage() {
  const qc = useQueryClient();
  const [clientId, setClientId] = useState('');
  const [tab, setTab] = useState<Tab>('centros');
  const [search, setSearch] = useState('');

  // ── Centro de Custo ────────────────────────────────────────────────────────
  const [showCcForm, setShowCcForm] = useState(false);
  const [editingCc, setEditingCc] = useState<CostCenter | null>(null);
  const [ccForm, setCcForm] = useState({ code: '', name: '', type: 'OPERACIONAL' as CostCenterType, parentId: '', required: false, notes: '' });

  const { data: costCenters = [], isLoading: loadingCc } = useQuery({
    queryKey: ['costCenters', clientId], queryFn: () => fetchCostCenters(clientId), enabled: !!clientId,
  });

  const createCc = useMutation({ mutationFn: createCostCenterApi, onSuccess: () => { qc.invalidateQueries({ queryKey: ['costCenters'] }); setShowCcForm(false); } });
  const updateCc = useMutation({ mutationFn: ({ id, d }: { id: string; d: Partial<typeof ccForm> }) => updateCostCenterApi(id, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['costCenters'] }); setEditingCc(null); setShowCcForm(false); } });
  const deleteCc = useMutation({ mutationFn: deleteCostCenterApi, onSuccess: () => qc.invalidateQueries({ queryKey: ['costCenters'] }) });

  function submitCc(e: React.FormEvent) {
    e.preventDefault();
    if (editingCc) updateCc.mutate({ id: editingCc.id, d: { ...ccForm, parentId: ccForm.parentId || undefined } });
    else createCc.mutate({ clientId, ...ccForm, parentId: ccForm.parentId || null });
  }

  // ── Histórico Padrão ───────────────────────────────────────────────────────
  const [showHisForm, setShowHisForm] = useState(false);
  const [editingHis, setEditingHis] = useState<StandardHistory | null>(null);
  const [hisForm, setHisForm] = useState({ code: '', text: '', complement: '' });

  const { data: histories = [], isLoading: loadingHis } = useQuery({
    queryKey: ['standardHistories', clientId, search], queryFn: () => fetchStandardHistories(clientId, search || undefined), enabled: !!clientId,
  });

  const createHis = useMutation({ mutationFn: createStandardHistoryApi, onSuccess: () => { qc.invalidateQueries({ queryKey: ['standardHistories'] }); setShowHisForm(false); } });
  const updateHis = useMutation({ mutationFn: ({ id, d }: { id: string; d: Partial<typeof hisForm> }) => updateStandardHistoryApi(id, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['standardHistories'] }); setEditingHis(null); setShowHisForm(false); } });
  const deleteHis = useMutation({ mutationFn: deleteStandardHistoryApi, onSuccess: () => qc.invalidateQueries({ queryKey: ['standardHistories'] }) });

  function submitHis(e: React.FormEvent) {
    e.preventDefault();
    if (editingHis) updateHis.mutate({ id: editingHis.id, d: hisForm });
    else createHis.mutate({ clientId, ...hisForm });
  }

  // ── Tipos de Lançamento ────────────────────────────────────────────────────
  const [showEtForm, setShowEtForm] = useState(false);
  const [editingEt, setEditingEt] = useState<EntryType | null>(null);
  const [etForm, setEtForm] = useState({ code: '', name: '', classification: 'NORMAL' as EntryTypeClass, appearsInReports: true, allowsReversal: true, notes: '' });

  const { data: entryTypes = [], isLoading: loadingEt } = useQuery({
    queryKey: ['entryTypes', clientId], queryFn: () => fetchEntryTypes(clientId), enabled: !!clientId,
  });

  const createEt = useMutation({ mutationFn: createEntryTypeApi, onSuccess: () => { qc.invalidateQueries({ queryKey: ['entryTypes'] }); setShowEtForm(false); } });
  const updateEt = useMutation({ mutationFn: ({ id, d }: { id: string; d: Partial<typeof etForm> }) => updateEntryTypeApi(id, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['entryTypes'] }); setEditingEt(null); setShowEtForm(false); } });
  const deleteEt = useMutation({ mutationFn: deleteEntryTypeApi, onSuccess: () => qc.invalidateQueries({ queryKey: ['entryTypes'] }) });

  function submitEt(e: React.FormEvent) {
    e.preventDefault();
    if (editingEt) updateEt.mutate({ id: editingEt.id, d: etForm });
    else createEt.mutate({ clientId, ...etForm });
  }

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: 'centros', label: 'Centros de Custo', count: costCenters.length },
    { key: 'historicos', label: 'Históricos Padrão', count: histories.length },
    { key: 'tipos', label: 'Tipos de Lançamento', count: entryTypes.length },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cadastros Contábeis"
        description="Centros de custo, históricos padrão e tipos de lançamento"
        action={
          clientId ? (
            <button type="button"
              onClick={() => {
                if (tab === 'centros') { setEditingCc(null); setCcForm({ code: '', name: '', type: 'OPERACIONAL', parentId: '', required: false, notes: '' }); setShowCcForm(true); }
                if (tab === 'historicos') { setEditingHis(null); setHisForm({ code: '', text: '', complement: '' }); setShowHisForm(true); }
                if (tab === 'tipos') { setEditingEt(null); setEtForm({ code: '', name: '', classification: 'NORMAL', appearsInReports: true, allowsReversal: true, notes: '' }); setShowEtForm(true); }
              }}
              className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600">
              + Novo
            </button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap gap-3">
        <input className="input flex-1 min-w-[180px]" placeholder="ID do Cliente" value={clientId} onChange={e => setClientId(e.target.value.trim())} />
        {tab === 'historicos' && <input className="input flex-1 min-w-[180px]" placeholder="Buscar histórico..." value={search} onChange={e => setSearch(e.target.value)} />}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 w-fit">
        {TABS.map(t => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === t.key ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label} {clientId && <span className="ml-1 text-xs text-slate-400">({t.count})</span>}
          </button>
        ))}
      </div>

      {!clientId && (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400">Informe o ID do cliente</div>
      )}

      {/* ── CENTROS DE CUSTO ── */}
      {clientId && tab === 'centros' && (
        <>
          {showCcForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <h2 className="mb-4 text-lg font-semibold">{editingCc ? 'Editar' : 'Novo'} Centro de Custo</h2>
                <form onSubmit={submitCc} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs text-slate-500 mb-1">Código *</label><input required className="input" value={ccForm.code} onChange={e => setCcForm({ ...ccForm, code: e.target.value })} /></div>
                    <div><label className="block text-xs text-slate-500 mb-1">Tipo *</label>
                      <select className="input" value={ccForm.type} onChange={e => setCcForm({ ...ccForm, type: e.target.value as CostCenterType })}>
                        {Object.entries(CC_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                  </div>
                  <div><label className="block text-xs text-slate-500 mb-1">Nome *</label><input required className="input" value={ccForm.name} onChange={e => setCcForm({ ...ccForm, name: e.target.value })} /></div>
                  <div><label className="block text-xs text-slate-500 mb-1">Centro Pai (ID)</label><input className="input font-mono text-xs" value={ccForm.parentId} onChange={e => setCcForm({ ...ccForm, parentId: e.target.value })} placeholder="Deixe em branco para raiz" /></div>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={ccForm.required} onChange={e => setCcForm({ ...ccForm, required: e.target.checked })} />
                    Obrigatório nos lançamentos
                  </label>
                  <div><label className="block text-xs text-slate-500 mb-1">Observações</label><textarea className="input" rows={2} value={ccForm.notes} onChange={e => setCcForm({ ...ccForm, notes: e.target.value })} /></div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowCcForm(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm">Cancelar</button>
                    <button type="submit" className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white">Salvar</button>
                  </div>
                </form>
              </div>
            </div>
          )}
          <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-50">
            {loadingCc ? <p className="p-6 text-slate-400">Carregando...</p> :
            costCenters.length === 0 ? <p className="p-6 text-center text-slate-400">Nenhum centro de custo</p> :
            costCenters.sort((a, b) => a.code.localeCompare(b.code)).map(cc => (
              <div key={cc.id} className="flex items-center gap-3 px-5 py-3 group">
                <span className="font-mono text-xs text-slate-400 w-16">{cc.code}</span>
                <span className="flex-1 text-sm font-medium text-slate-700">{cc.name}</span>
                <Badge label={CC_TYPE_LABELS[cc.type]} color="bg-slate-100 text-slate-600" />
                {cc.required && <Badge label="Obrigatório" color="bg-orange-100 text-orange-700" />}
                {!cc.active && <Badge label="Inativo" color="bg-red-100 text-red-600" />}
                <div className="hidden group-hover:flex gap-2">
                  <button type="button" onClick={() => { setEditingCc(cc); setCcForm({ code: cc.code, name: cc.name, type: cc.type, parentId: cc.parentId ?? '', required: cc.required, notes: cc.notes ?? '' }); setShowCcForm(true); }} className="text-xs text-slate-500 hover:text-slate-700">Editar</button>
                  <button type="button" onClick={() => { if (confirm('Excluir?')) deleteCc.mutate(cc.id); }} className="text-xs text-red-400 hover:text-red-600">Excluir</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── HISTÓRICOS ── */}
      {clientId && tab === 'historicos' && (
        <>
          {showHisForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <h2 className="mb-4 text-lg font-semibold">{editingHis ? 'Editar' : 'Novo'} Histórico Padrão</h2>
                <form onSubmit={submitHis} className="space-y-4">
                  <div><label className="block text-xs text-slate-500 mb-1">Código *</label><input required className="input" value={hisForm.code} onChange={e => setHisForm({ ...hisForm, code: e.target.value })} /></div>
                  <div><label className="block text-xs text-slate-500 mb-1">Texto Base *</label><input required className="input" value={hisForm.text} onChange={e => setHisForm({ ...hisForm, text: e.target.value })} placeholder="Ex: Pagamento de duplicata" /></div>
                  <div><label className="block text-xs text-slate-500 mb-1">Complemento</label><input className="input" value={hisForm.complement} onChange={e => setHisForm({ ...hisForm, complement: e.target.value })} placeholder="Ex: Nº {{documento}} — competência {{periodo}}" /></div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowHisForm(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm">Cancelar</button>
                    <button type="submit" className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white">Salvar</button>
                  </div>
                </form>
              </div>
            </div>
          )}
          <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-50">
            {loadingHis ? <p className="p-6 text-slate-400">Carregando...</p> :
            histories.length === 0 ? <p className="p-6 text-center text-slate-400">Nenhum histórico</p> :
            histories.map(h => (
              <div key={h.id} className="flex items-center gap-3 px-5 py-3 group">
                <span className="font-mono text-xs text-slate-400 w-12">{h.code}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">{h.text}</p>
                  {h.complement && <p className="text-xs text-slate-400">{h.complement}</p>}
                </div>
                {!h.active && <Badge label="Inativo" color="bg-red-100 text-red-600" />}
                <div className="hidden group-hover:flex gap-2">
                  <button type="button" onClick={() => { setEditingHis(h); setHisForm({ code: h.code, text: h.text, complement: h.complement ?? '' }); setShowHisForm(true); }} className="text-xs text-slate-500 hover:text-slate-700">Editar</button>
                  <button type="button" onClick={() => { if (confirm('Excluir?')) deleteHis.mutate(h.id); }} className="text-xs text-red-400 hover:text-red-600">Excluir</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── TIPOS DE LANÇAMENTO ── */}
      {clientId && tab === 'tipos' && (
        <>
          {showEtForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <h2 className="mb-4 text-lg font-semibold">{editingEt ? 'Editar' : 'Novo'} Tipo de Lançamento</h2>
                <form onSubmit={submitEt} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs text-slate-500 mb-1">Código *</label><input required className="input" value={etForm.code} onChange={e => setEtForm({ ...etForm, code: e.target.value })} /></div>
                    <div><label className="block text-xs text-slate-500 mb-1">Classificação *</label>
                      <select className="input" value={etForm.classification} onChange={e => setEtForm({ ...etForm, classification: e.target.value as EntryTypeClass })}>
                        {Object.entries(ET_CLASS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                  </div>
                  <div><label className="block text-xs text-slate-500 mb-1">Nome *</label><input required className="input" value={etForm.name} onChange={e => setEtForm({ ...etForm, name: e.target.value })} /></div>
                  <div className="flex gap-6 text-sm">
                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={etForm.appearsInReports} onChange={e => setEtForm({ ...etForm, appearsInReports: e.target.checked })} />Aparece em Relatórios</label>
                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={etForm.allowsReversal} onChange={e => setEtForm({ ...etForm, allowsReversal: e.target.checked })} />Permite Estorno</label>
                  </div>
                  <div><label className="block text-xs text-slate-500 mb-1">Observações</label><textarea className="input" rows={2} value={etForm.notes} onChange={e => setEtForm({ ...etForm, notes: e.target.value })} /></div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowEtForm(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm">Cancelar</button>
                    <button type="submit" className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white">Salvar</button>
                  </div>
                </form>
              </div>
            </div>
          )}
          <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-50">
            {loadingEt ? <p className="p-6 text-slate-400">Carregando...</p> :
            entryTypes.length === 0 ? <p className="p-6 text-center text-slate-400">Nenhum tipo de lançamento</p> :
            entryTypes.map(et => (
              <div key={et.id} className="flex items-center gap-3 px-5 py-3 group">
                <span className="font-mono text-xs text-slate-400 w-12">{et.code}</span>
                <span className="flex-1 text-sm font-medium text-slate-700">{et.name}</span>
                <Badge label={ET_CLASS_LABELS[et.classification]} color="bg-purple-100 text-purple-700" />
                {et.appearsInReports && <Badge label="Relatórios" color="bg-blue-50 text-blue-600" />}
                {et.allowsReversal && <Badge label="Estornável" color="bg-green-50 text-green-600" />}
                {!et.active && <Badge label="Inativo" color="bg-red-100 text-red-600" />}
                <div className="hidden group-hover:flex gap-2">
                  <button type="button" onClick={() => { setEditingEt(et); setEtForm({ code: et.code, name: et.name, classification: et.classification, appearsInReports: et.appearsInReports, allowsReversal: et.allowsReversal, notes: et.notes ?? '' }); setShowEtForm(true); }} className="text-xs text-slate-500 hover:text-slate-700">Editar</button>
                  <button type="button" onClick={() => { if (confirm('Excluir?')) deleteEt.mutate(et.id); }} className="text-xs text-red-400 hover:text-red-600">Excluir</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
