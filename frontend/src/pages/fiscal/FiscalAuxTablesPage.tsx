import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import {
  fetchCfop,
  upsertCfop,
  deleteCfop,
  fetchCst,
  fetchOperationNatures,
  createOperationNature,
  deleteOperationNature,
} from '../../services/fiscalService';
import type { CfopEntry, CstEntry, OperationNature } from '../../types';

type Tab = 'cfop' | 'cst' | 'naturezas';

export function FiscalAuxTablesPage() {
  const [tab, setTab] = useState<Tab>('cfop');

  const [cfop, setCfop] = useState<CfopEntry[]>([]);
  const [cst, setCst] = useState<CstEntry[]>([]);
  const [natures, setNatures] = useState<OperationNature[]>([]);

  const [cfopFilter, setCfopFilter] = useState<'ENTRADA' | 'SAIDA' | ''>('');
  const [cstFilter, setCstFilter] = useState('');

  const [newCfop, setNewCfop] = useState({ code: '', description: '', operationType: 'ENTRADA' as 'ENTRADA' | 'SAIDA', creditImpact: '', active: true });
  const [newNature, setNewNature] = useState({ code: '', description: '', cfop: '', active: true });

  useEffect(() => {
    fetchCfop(cfopFilter || undefined).then(setCfop);
  }, [cfopFilter]);

  useEffect(() => {
    fetchCst(cstFilter || undefined).then(setCst);
  }, [cstFilter]);

  useEffect(() => {
    if (tab === 'naturezas') fetchOperationNatures().then(setNatures);
  }, [tab]);

  async function handleAddCfop() {
    if (!newCfop.code || !newCfop.description) return;
    const created = await upsertCfop(newCfop);
    setCfop((prev) => {
      const idx = prev.findIndex((c) => c.code === created.code);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = created;
        return next;
      }
      return [...prev, created];
    });
    setNewCfop({ code: '', description: '', operationType: 'ENTRADA', creditImpact: '', active: true });
  }

  async function handleDeleteCfop(id: string) {
    if (!confirm('Excluir este CFOP?')) return;
    await deleteCfop(id);
    setCfop((prev) => prev.filter((c) => c.id !== id));
  }

  async function handleAddNature() {
    if (!newNature.code || !newNature.description || !newNature.cfop) return;
    const created = await createOperationNature({ ...newNature, clientId: null });
    setNatures((prev) => [...prev, created]);
    setNewNature({ code: '', description: '', cfop: '', active: true });
  }

  async function handleDeleteNature(id: string) {
    if (!confirm('Excluir esta natureza de operação?')) return;
    await deleteOperationNature(id);
    setNatures((prev) => prev.filter((n) => n.id !== id));
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'cfop', label: 'CFOP' },
    { key: 'cst', label: 'CST / CSOSN' },
    { key: 'naturezas', label: 'Naturezas de Operação' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tabelas Auxiliares Fiscais"
        description="CFOP, CST, CSOSN e naturezas de operação"
      />

      <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
              tab === t.key
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'cfop' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              value={cfopFilter}
              onChange={(e) => setCfopFilter(e.target.value as 'ENTRADA' | 'SAIDA' | '')}
            >
              <option value="">Todos</option>
              <option value="ENTRADA">Entradas</option>
              <option value="SAIDA">Saídas</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
            <input
              placeholder="Código CFOP"
              className="input w-28 font-mono"
              value={newCfop.code}
              onChange={(e) => setNewCfop((p) => ({ ...p, code: e.target.value }))}
            />
            <input
              placeholder="Descrição"
              className="input flex-1 min-w-48"
              value={newCfop.description}
              onChange={(e) => setNewCfop((p) => ({ ...p, description: e.target.value }))}
            />
            <select
              className="input w-32"
              value={newCfop.operationType}
              onChange={(e) => setNewCfop((p) => ({ ...p, operationType: e.target.value as 'ENTRADA' | 'SAIDA' }))}
            >
              <option value="ENTRADA">Entrada</option>
              <option value="SAIDA">Saída</option>
            </select>
            <button
              onClick={handleAddCfop}
              className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
            >
              <Plus size={14} /> Adicionar
            </button>
          </div>

          <DataTable headers={['Código', 'Descrição', 'Tipo', '']}>
            {cfop.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sm text-slate-400">
                  Nenhum CFOP cadastrado.
                </td>
              </tr>
            ) : (
              cfop.map((c) => (
                <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-mono font-semibold text-slate-700">{c.code}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{c.description}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.operationType === 'ENTRADA' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                      {c.operationType === 'ENTRADA' ? 'Entrada' : 'Saída'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDeleteCfop(c.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </DataTable>
        </div>
      )}

      {tab === 'cst' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              value={cstFilter}
              onChange={(e) => setCstFilter(e.target.value)}
            >
              <option value="">Todos os tipos</option>
              <option value="ICMS">ICMS</option>
              <option value="IPI">IPI</option>
              <option value="PIS_COFINS">PIS/COFINS</option>
              <option value="CSOSN">CSOSN</option>
            </select>
          </div>

          <DataTable headers={['Código', 'Descrição', 'Tipo', 'Entrada/Saída']}>
            {cst.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sm text-slate-400">
                  Nenhum CST cadastrado. Use a API para importar a tabela oficial.
                </td>
              </tr>
            ) : (
              cst.map((c) => (
                <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-mono font-semibold text-slate-700">{c.code}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{c.description}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{c.taxType.replace('_', '/')}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{c.entryExit ?? '—'}</td>
                </tr>
              ))
            )}
          </DataTable>
        </div>
      )}

      {tab === 'naturezas' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
            <input
              placeholder="Código"
              className="input w-28"
              value={newNature.code}
              onChange={(e) => setNewNature((p) => ({ ...p, code: e.target.value }))}
            />
            <input
              placeholder="Descrição"
              className="input flex-1 min-w-48"
              value={newNature.description}
              onChange={(e) => setNewNature((p) => ({ ...p, description: e.target.value }))}
            />
            <input
              placeholder="CFOP"
              className="input w-24 font-mono"
              value={newNature.cfop}
              onChange={(e) => setNewNature((p) => ({ ...p, cfop: e.target.value }))}
            />
            <button
              onClick={handleAddNature}
              className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
            >
              <Plus size={14} /> Adicionar
            </button>
          </div>

          <DataTable headers={['Código', 'Descrição', 'CFOP', '']}>
            {natures.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sm text-slate-400">
                  Nenhuma natureza de operação cadastrada.
                </td>
              </tr>
            ) : (
              natures.map((n) => (
                <tr key={n.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-mono text-slate-700">{n.code}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{n.description}</td>
                  <td className="px-4 py-3 text-sm font-mono text-slate-500">{n.cfop}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDeleteNature(n.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </DataTable>
        </div>
      )}
    </div>
  );
}
