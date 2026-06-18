import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../../components/PageHeader';
import {
  fetchAccounts, createAccountApi, updateAccountApi,
  deleteAccountApi, importDefaultPlanApi,
} from '../../services/accountingService';
import type { AccountingPlan, AccountClass, AccountNature, AccountType } from '../../types';

const CLASS_LABELS: Record<AccountClass, string> = {
  ATIVO: 'Ativo', PASSIVO: 'Passivo', PATRIMONIO_LIQUIDO: 'Patrimônio Líquido',
  RECEITA: 'Receita', DESPESA: 'Despesa', CUSTO: 'Custo', RESULTADO: 'Resultado',
};
const CLASS_COLORS: Record<AccountClass, string> = {
  ATIVO: 'text-blue-600', PASSIVO: 'text-red-600', PATRIMONIO_LIQUIDO: 'text-purple-600',
  RECEITA: 'text-green-600', DESPESA: 'text-orange-600', CUSTO: 'text-yellow-700', RESULTADO: 'text-slate-600',
};

type Form = {
  clientId: string; code: string; name: string;
  type: AccountType; nature: AccountNature; classification: AccountClass;
  parentId: string; allowsEntry: boolean; usesCostCenter: boolean;
  usesStdHistory: boolean; spedRefCode: string; ecfRefCode: string; notes: string;
};

const EMPTY: Omit<Form, 'clientId'> = {
  code: '', name: '', type: 'ANALITICA', nature: 'DEVEDORA', classification: 'ATIVO',
  parentId: '', allowsEntry: true, usesCostCenter: false, usesStdHistory: false,
  spedRefCode: '', ecfRefCode: '', notes: '',
};

export function AccountingPlanPage() {
  const qc = useQueryClient();
  const [clientId, setClientId] = useState('');
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AccountingPlan | null>(null);
  const [form, setForm] = useState<Form>({ clientId: '', ...EMPTY });

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['accounts', clientId],
    queryFn: () => fetchAccounts(clientId),
    enabled: !!clientId,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['accounts', clientId] });

  const create = useMutation({ mutationFn: createAccountApi, onSuccess: () => { invalidate(); setShowForm(false); } });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update = useMutation({ mutationFn: ({ id, data }: { id: string; data: any }) => updateAccountApi(id, data), onSuccess: () => { invalidate(); setEditing(null); } });
  const remove = useMutation({ mutationFn: deleteAccountApi, onSuccess: invalidate });
  const importPlan = useMutation({
    mutationFn: () => importDefaultPlanApi(clientId),
    onSuccess: (r) => { invalidate(); alert(`${r.imported} contas importadas com sucesso.`); },
    onError: (e: Error) => alert(e.message),
  });

  // Filtragem + construção de árvore
  const filtered = useMemo(() => {
    let list = accounts;
    if (filterClass) list = list.filter(a => a.classification === filterClass);
    if (search) list = list.filter(a => a.code.includes(search) || a.name.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [accounts, filterClass, search]);

  // Árvore: agrupa por parentId
  const tree = useMemo(() => {
    if (search || filterClass) return filtered; // Modo plano quando filtrando
    const byParent: Record<string, AccountingPlan[]> = {};
    for (const a of filtered) {
      const key = a.parentId ?? 'root';
      if (!byParent[key]) byParent[key] = [];
      byParent[key].push(a);
    }
    return byParent['root'] ?? [];
  }, [filtered, search, filterClass]);

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function openCreate(parentId?: string) {
    setForm({ clientId, ...EMPTY, parentId: parentId ?? '' });
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(acc: AccountingPlan) {
    setForm({
      clientId,
      code: acc.code, name: acc.name, type: acc.type, nature: acc.nature,
      classification: acc.classification, parentId: acc.parentId ?? '',
      allowsEntry: acc.allowsEntry, usesCostCenter: acc.usesCostCenter,
      usesStdHistory: acc.usesStdHistory, spedRefCode: acc.spedRefCode ?? '',
      ecfRefCode: acc.ecfRefCode ?? '', notes: acc.notes ?? '',
    });
    setEditing(acc);
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, clientId, parentId: form.parentId || null };
    const apiPayload = { ...payload, parentId: payload.parentId ?? null };
    if (editing) update.mutate({ id: editing.id, data: apiPayload });
    else create.mutate(apiPayload);
  }

  const byParentMap = useMemo(() => {
    const m: Record<string, AccountingPlan[]> = {};
    for (const a of accounts) {
      const k = a.parentId ?? 'root';
      if (!m[k]) m[k] = [];
      m[k].push(a);
    }
    return m;
  }, [accounts]);

  function renderTree(items: AccountingPlan[], depth = 0): React.ReactNode {
    return items.sort((a, b) => a.code.localeCompare(b.code)).map(acc => {
      const children = byParentMap[acc.id] ?? [];
      const isExpanded = expanded.has(acc.id);
      const isSintetica = acc.type === 'SINTETICA';

      return (
        <div key={acc.id}>
          <div
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-50 group ${!acc.active ? 'opacity-50' : ''}`}
            style={{ paddingLeft: `${12 + depth * 20}px` }}
          >
            {isSintetica ? (
              <button type="button" onClick={() => toggleExpand(acc.id)} className="w-4 text-slate-400 hover:text-slate-600 flex-shrink-0">
                {children.length > 0 ? (isExpanded ? '▼' : '▶') : '·'}
              </button>
            ) : (
              <span className="w-4 text-slate-300 flex-shrink-0">—</span>
            )}
            <span className="font-mono text-xs text-slate-400 w-24 flex-shrink-0">{acc.code}</span>
            <span className={`flex-1 font-medium ${isSintetica ? 'text-slate-700 font-semibold' : 'text-slate-600'}`}>{acc.name}</span>
            <span className={`text-xs ${CLASS_COLORS[acc.classification]}`}>{CLASS_LABELS[acc.classification]}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${acc.nature === 'DEVEDORA' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
              {acc.nature === 'DEVEDORA' ? 'D' : 'C'}
            </span>
            {!acc.allowsEntry && <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">Sintética</span>}
            <div className="hidden group-hover:flex gap-1">
              {isSintetica && (
                <button type="button" onClick={() => openCreate(acc.id)} className="text-xs text-sky-600 hover:underline">+ Subconta</button>
              )}
              <button type="button" onClick={() => openEdit(acc)} className="text-xs text-slate-500 hover:text-slate-700">Editar</button>
              <button type="button" onClick={() => { if (confirm(`Excluir ${acc.code}?`)) remove.mutate(acc.id); }} className="text-xs text-red-400 hover:text-red-600">Excluir</button>
            </div>
          </div>
          {isSintetica && isExpanded && children.length > 0 && renderTree(children, depth + 1)}
        </div>
      );
    });
  }

  const rootAccounts = byParentMap['root'] ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plano de Contas"
        description="Estrutura de contas contábeis hierárquica — sintéticas e analíticas"
        action={
          <div className="flex gap-2">
            {clientId && (
              <>
                <button type="button" onClick={() => importPlan.mutate()} disabled={importPlan.isPending}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                  {importPlan.isPending ? 'Importando...' : 'Importar Plano Padrão'}
                </button>
                <button type="button" onClick={() => openCreate()}
                  className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600">
                  + Nova Conta
                </button>
              </>
            )}
          </div>
        }
      />

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <input className="input flex-1 min-w-[180px]" placeholder="ID do Cliente" value={clientId} onChange={e => setClientId(e.target.value.trim())} />
        <input className="input flex-1 min-w-[150px]" placeholder="Buscar código ou nome..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input w-44" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
          <option value="">Todas as classes</option>
          {Object.entries(CLASS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        {(search || filterClass) && (
          <button type="button" onClick={() => { setSearch(''); setFilterClass(''); }} className="text-sm text-slate-400 hover:text-slate-600">Limpar</button>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl overflow-y-auto max-h-[90vh]">
            <h2 className="mb-4 text-lg font-semibold">{editing ? 'Editar Conta' : 'Nova Conta'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Código *</label>
                  <input required className="input font-mono" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="1.1.1.01" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Tipo *</label>
                  <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as AccountType, allowsEntry: e.target.value === 'ANALITICA' })}>
                    <option value="SINTETICA">Sintética (Agrupadora)</option>
                    <option value="ANALITICA">Analítica (Lançável)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Nome *</label>
                <input required className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Natureza *</label>
                  <select className="input" value={form.nature} onChange={e => setForm({ ...form, nature: e.target.value as AccountNature })}>
                    <option value="DEVEDORA">Devedora</option>
                    <option value="CREDORA">Credora</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Classificação *</label>
                  <select className="input" value={form.classification} onChange={e => setForm({ ...form, classification: e.target.value as AccountClass })}>
                    {Object.entries(CLASS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Conta Pai (ID)</label>
                <input className="input font-mono text-xs" value={form.parentId} onChange={e => setForm({ ...form, parentId: e.target.value })} placeholder="Deixe em branco para conta raiz" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Código SPED (ECD)</label>
                  <input className="input" value={form.spedRefCode} onChange={e => setForm({ ...form, spedRefCode: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Código ECF</label>
                  <input className="input" value={form.ecfRefCode} onChange={e => setForm({ ...form, ecfRefCode: e.target.value })} />
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                {[
                  { key: 'allowsEntry', label: 'Permite Lançamento' },
                  { key: 'usesCostCenter', label: 'Usa Centro de Custo' },
                  { key: 'usesStdHistory', label: 'Usa Histórico Padrão' },
                  { key: 'integratesModules', label: 'Integra Módulos' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form[key as keyof Form] as boolean}
                      onChange={e => setForm({ ...form, [key]: e.target.checked })} />
                    {label}
                  </label>
                ))}
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Observações</label>
                <textarea className="input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
              {(create.error || update.error) && (
                <p className="text-sm text-red-600">{((create.error || update.error) as Error)?.message}</p>
              )}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm">Cancelar</button>
                <button type="submit" disabled={create.isPending || update.isPending}
                  className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                  {create.isPending || update.isPending ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Conteúdo */}
      {!clientId ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400">Informe o ID do cliente</div>
      ) : isLoading ? (
        <p className="text-slate-400">Carregando...</p>
      ) : accounts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <p className="text-slate-400 mb-4">Nenhuma conta cadastrada</p>
          <button type="button" onClick={() => importPlan.mutate()}
            className="rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-600">
            Importar Plano Padrão
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 bg-slate-50">
            <div className="flex gap-2">
              <button type="button" onClick={() => setExpanded(new Set(accounts.filter(a => a.type === 'SINTETICA').map(a => a.id)))}
                className="text-xs text-slate-500 hover:text-sky-600">Expandir tudo</button>
              <span className="text-slate-300">|</span>
              <button type="button" onClick={() => setExpanded(new Set())}
                className="text-xs text-slate-500 hover:text-slate-700">Recolher tudo</button>
            </div>
            <span className="text-xs text-slate-400">{accounts.length} contas</span>
          </div>
          <div className="py-1">
            {search || filterClass
              ? filtered.sort((a, b) => a.code.localeCompare(b.code)).map(acc => (
                  <div key={acc.id} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50 group">
                    <span className="font-mono text-xs text-slate-400 w-24">{acc.code}</span>
                    <span className="flex-1 text-slate-700">{acc.name}</span>
                    <span className={`text-xs ${CLASS_COLORS[acc.classification]}`}>{CLASS_LABELS[acc.classification]}</span>
                    <div className="hidden group-hover:flex gap-2">
                      <button type="button" onClick={() => openEdit(acc)} className="text-xs text-slate-500 hover:text-slate-700">Editar</button>
                      <button type="button" onClick={() => { if (confirm('Excluir?')) remove.mutate(acc.id); }} className="text-xs text-red-400">Excluir</button>
                    </div>
                  </div>
                ))
              : renderTree(rootAccounts)
            }
          </div>
        </div>
      )}
    </div>
  );
}
