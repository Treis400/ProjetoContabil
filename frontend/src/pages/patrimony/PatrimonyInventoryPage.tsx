import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import * as svc from '../../services/patrimonyService';
import * as clientSvc from '../../services/clientService';

const btn = 'rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600';
const btnSec = 'rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50';
const lbl = 'block text-xs font-medium text-slate-500 mb-1';

const STATUS: Record<string, { label: string; color: string }> = {
  ABERTO: { label: 'Aberto', color: 'bg-sky-50 text-sky-700' },
  EM_ANDAMENTO: { label: 'Em Andamento', color: 'bg-yellow-50 text-yellow-700' },
  CONCLUIDO: { label: 'Concluído', color: 'bg-green-50 text-green-700' },
};

export function PatrimonyInventoryPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [clientId, setClientId] = useState('');
  const [inventories, setInventories] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ name: '', startDate: '' });

  useEffect(() => { clientSvc.fetchClients().then(setClients); }, []);
  useEffect(() => { if (clientId) load(); }, [clientId]);

  async function load() { setInventories(await svc.listInventories(clientId)); }

  async function openInventory(id: string) { setSelected(await svc.getInventory(id)); }

  async function doCreate(e: React.FormEvent) {
    e.preventDefault();
    await svc.createInventory(clientId, { ...newForm, startDate: new Date(newForm.startDate) });
    setShowNew(false);
    load();
  }

  async function doClose(id: string) {
    if (!confirm('Encerrar inventário?')) return;
    await svc.closeInventory(id, clientId);
    load();
    if (selected?.id === id) setSelected(null);
  }

  async function toggleFound(item: any) {
    await svc.updateInventoryItem(selected.id, item.id, clientId, { found: !item.found, checkedAt: new Date() });
    openInventory(selected.id);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventário Patrimonial"
        description="Contagem física e conciliação dos bens do ativo imobilizado"
        action={clientId && !selected ? <button className={btn} onClick={() => setShowNew(true)}>+ Novo Inventário</button> : undefined}
      />

      {!selected && (
        <>
          <select className="input w-80" value={clientId} onChange={e => { setClientId(e.target.value); }}>
            <option value="">Selecione a empresa...</option>
            {clients.map((c: any) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
          </select>

          {showNew && (
            <form onSubmit={doCreate} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
              <h3 className="font-medium text-slate-900">Novo Inventário</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>Nome *</label><input className="input" value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))} required /></div>
                <div><label className={lbl}>Data de Início *</label><input className="input" type="date" value={newForm.startDate} onChange={e => setNewForm(f => ({ ...f, startDate: e.target.value }))} required /></div>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" className={btnSec} onClick={() => setShowNew(false)}>Cancelar</button>
                <button type="submit" className={btn}>Criar e Gerar Lista</button>
              </div>
            </form>
          )}

          <DataTable headers={['Nome', 'Início', 'Status', 'Bens', '']}>
            {inventories.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-sm text-slate-400">{clientId ? 'Nenhum inventário.' : 'Selecione uma empresa.'}</td></tr>
            ) : inventories.map((r: any) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-medium text-slate-900">{r.name}</td>
                <td className="px-4 py-3 text-sm">{new Date(r.startDate).toLocaleDateString('pt-BR')}</td>
                <td className="px-4 py-3"><span className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${STATUS[r.status]?.color}`}>{STATUS[r.status]?.label}</span></td>
                <td className="px-4 py-3 text-sm text-slate-600">{r._count?.items ?? 0}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button className="text-sky-600 hover:underline text-sm" onClick={() => openInventory(r.id)}>Abrir</button>
                  {r.status !== 'CONCLUIDO' && <button className="text-green-600 hover:underline text-sm" onClick={() => doClose(r.id)}>Encerrar</button>}
                </td>
              </tr>
            ))}
          </DataTable>
        </>
      )}

      {selected && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <button className={btnSec} onClick={() => setSelected(null)}>← Voltar</button>
            <div>
              <h2 className="font-semibold text-slate-900">{selected.name}</h2>
              <p className="text-sm text-slate-500">Iniciado em {new Date(selected.startDate).toLocaleDateString('pt-BR')}</p>
            </div>
            {selected.status !== 'CONCLUIDO' && (
              <button className={btn + ' ml-auto'} onClick={() => doClose(selected.id)}>Encerrar Inventário</button>
            )}
          </div>

          {/* Resumo */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total de Bens', value: selected.items?.length ?? 0, color: 'text-slate-900' },
              { label: 'Encontrados', value: selected.items?.filter((i: any) => i.found === true).length ?? 0, color: 'text-green-600' },
              { label: 'Não Localizados', value: selected.items?.filter((i: any) => i.found === false).length ?? 0, color: 'text-red-600' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <DataTable headers={['Tombamento', 'Descrição', 'Grupo', 'Local Cadastrado', 'Localizado?', 'Verificado em']}>
            {(selected.items ?? []).map((r: any) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-medium">{r.asset?.tombamento}</td>
                <td className="px-4 py-3 text-sm text-slate-900">{r.asset?.description}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{r.asset?.group?.name ?? '—'}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{r.asset?.location?.name ?? '—'}</td>
                <td className="px-4 py-3">
                  {selected.status !== 'CONCLUIDO' ? (
                    <button
                      onClick={() => toggleFound(r)}
                      className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium cursor-pointer transition ${r.found === true ? 'bg-green-100 text-green-700 hover:bg-green-200' : r.found === false ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                      {r.found === true ? '✓ Sim' : r.found === false ? '✗ Não' : 'Pendente'}
                    </button>
                  ) : (
                    <span className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${r.found === true ? 'bg-green-50 text-green-700' : r.found === false ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-500'}`}>
                      {r.found === true ? 'Sim' : r.found === false ? 'Não' : 'Pendente'}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">{r.checkedAt ? new Date(r.checkedAt).toLocaleDateString('pt-BR') : '—'}</td>
              </tr>
            ))}
          </DataTable>
        </div>
      )}
    </div>
  );
}
