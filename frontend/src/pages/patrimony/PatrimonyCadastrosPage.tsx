import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import * as svc from '../../services/patrimonyService';
import * as clientSvc from '../../services/clientService';

type Tab = 'grupos' | 'localizacoes' | 'responsaveis';
const lbl = 'block text-xs font-medium text-slate-500 mb-1';
const btn = 'rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600';
const btnSec = 'rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50';

export function PatrimonyCadastrosPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [clientId, setClientId] = useState('');
  const [tab, setTab] = useState<Tab>('grupos');
  const [data, setData] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>({});
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => { clientSvc.fetchClients().then(setClients); }, []);
  useEffect(() => { if (clientId) load(); }, [clientId, tab]);

  async function load() {
    if (!clientId) return;
    let rows: any[] = [];
    if (tab === 'grupos') rows = await svc.listGroups(clientId);
    if (tab === 'localizacoes') rows = await svc.listLocations(clientId);
    if (tab === 'responsaveis') rows = await svc.listResponsibles(clientId);
    setData(rows);
  }

  function startNew() { setForm({}); setEditing(null); setShowForm(true); }
  function startEdit(item: any) { setForm({ ...item }); setEditing(item.id); setShowForm(true); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      if (tab === 'grupos') await svc.updateGroup(editing, clientId, form);
      if (tab === 'localizacoes') await svc.updateLocation(editing, clientId, form);
      if (tab === 'responsaveis') await svc.updateResponsible(editing, clientId, form);
    } else {
      if (tab === 'grupos') await svc.createGroup(clientId, form);
      if (tab === 'localizacoes') await svc.createLocation(clientId, form);
      if (tab === 'responsaveis') await svc.createResponsible(clientId, form);
    }
    setShowForm(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir?')) return;
    if (tab === 'grupos') await svc.deleteGroup(id, clientId);
    if (tab === 'localizacoes') await svc.deleteLocation(id, clientId);
    if (tab === 'responsaveis') await svc.deleteResponsible(id, clientId);
    load();
  }

  const f = (k: string) => (e: any) => setForm((p: any) => ({ ...p, [k]: e.target.value }));

  const tabLabels: Record<Tab, string> = { grupos: 'Grupos', localizacoes: 'Localizações', responsaveis: 'Responsáveis' };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cadastros do Patrimônio"
        description="Grupos de bens, localizações e responsáveis"
        action={clientId ? <button className={btn} onClick={startNew}>+ Novo</button> : undefined}
      />

      <div className="flex flex-wrap gap-3">
        <select className="input" value={clientId} onChange={e => setClientId(e.target.value)}>
          <option value="">Selecione a empresa...</option>
          {clients.map((c: any) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
        </select>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 flex gap-0 px-2 pt-2">
          {(['grupos','localizacoes','responsaveis'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {tabLabels[t]}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-4">
          {showForm && (
            <form onSubmit={handleSave} className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-200">
              {tab === 'grupos' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div><label className={lbl}>Código *</label><input className="input" value={form.code ?? ''} onChange={f('code')} required /></div>
                  <div><label className={lbl}>Nome *</label><input className="input" value={form.name ?? ''} onChange={f('name')} required /></div>
                  <div><label className={lbl}>Método Depr.</label>
                    <select className="input" value={form.deprecMethod ?? 'LINEAR'} onChange={f('deprecMethod')}>
                      <option value="LINEAR">Linear</option>
                      <option value="SOMA_DIGITOS">Soma dos Dígitos</option>
                      <option value="UNIDADES_PRODUZIDAS">Unidades Produzidas</option>
                      <option value="HORAS_TRABALHADAS">Horas Trabalhadas</option>
                    </select></div>
                  <div><label className={lbl}>Vida Útil (anos)</label><input className="input" type="number" value={form.usefulLifeYears ?? 5} onChange={f('usefulLifeYears')} /></div>
                  <div><label className={lbl}>Taxa Anual (%)</label><input className="input" type="number" value={form.annualRate ?? 20} onChange={f('annualRate')} /></div>
                  <div><label className={lbl}>Conta Ativo</label><input className="input" value={form.assetAccountCode ?? ''} onChange={f('assetAccountCode')} /></div>
                  <div><label className={lbl}>Depr. Acum.</label><input className="input" value={form.accumDeprecAccountCode ?? ''} onChange={f('accumDeprecAccountCode')} /></div>
                  <div><label className={lbl}>Despesa Depr.</label><input className="input" value={form.deprecExpenseAccountCode ?? ''} onChange={f('deprecExpenseAccountCode')} /></div>
                </div>
              )}
              {tab === 'localizacoes' && (
                <div className="grid grid-cols-3 gap-3">
                  <div><label className={lbl}>Código *</label><input className="input" value={form.code ?? ''} onChange={f('code')} required /></div>
                  <div><label className={lbl}>Nome *</label><input className="input" value={form.name ?? ''} onChange={f('name')} required /></div>
                  <div><label className={lbl}>Tipo</label><input className="input" value={form.type ?? ''} onChange={f('type')} placeholder="Setor, Sala, Filial..." /></div>
                </div>
              )}
              {tab === 'responsaveis' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div><label className={lbl}>Nome *</label><input className="input" value={form.name ?? ''} onChange={f('name')} required /></div>
                  <div><label className={lbl}>Cargo</label><input className="input" value={form.role ?? ''} onChange={f('role')} /></div>
                  <div><label className={lbl}>Setor</label><input className="input" value={form.sector ?? ''} onChange={f('sector')} /></div>
                  <div><label className={lbl}>E-mail</label><input className="input" type="email" value={form.email ?? ''} onChange={f('email')} /></div>
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <button type="button" className={btnSec} onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className={btn}>Salvar</button>
              </div>
            </form>
          )}

          {tab === 'grupos' && (
            <DataTable headers={['Código', 'Nome', 'Método', 'Vida Útil', 'Taxa Anual', 'Conta Ativo', '']}>
              {data.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-sm text-slate-400">{clientId ? 'Nenhum grupo.' : 'Selecione uma empresa.'}</td></tr>
              ) : data.map((r: any) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-mono">{r.code}</td>
                  <td className="px-4 py-3 text-sm text-slate-900">{r.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{r.deprecMethod}</td>
                  <td className="px-4 py-3 text-sm">{r.usefulLifeYears} anos</td>
                  <td className="px-4 py-3 text-sm">{r.annualRate}%</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{r.assetAccountCode ?? '—'}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button className="text-sky-600 hover:underline text-sm" onClick={() => startEdit(r)}>Editar</button>
                    <button className="text-rose-500 hover:text-rose-700 text-sm" onClick={() => handleDelete(r.id)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </DataTable>
          )}

          {tab === 'localizacoes' && (
            <DataTable headers={['Código', 'Nome', 'Tipo', '']}>
              {data.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-sm text-slate-400">{clientId ? 'Nenhuma localização.' : 'Selecione uma empresa.'}</td></tr>
              ) : data.map((r: any) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-mono">{r.code}</td>
                  <td className="px-4 py-3 text-sm text-slate-900">{r.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{r.type ?? '—'}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button className="text-sky-600 hover:underline text-sm" onClick={() => startEdit(r)}>Editar</button>
                    <button className="text-rose-500 hover:text-rose-700 text-sm" onClick={() => handleDelete(r.id)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </DataTable>
          )}

          {tab === 'responsaveis' && (
            <DataTable headers={['Nome', 'Cargo', 'Setor', 'E-mail', '']}>
              {data.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-sm text-slate-400">{clientId ? 'Nenhum responsável.' : 'Selecione uma empresa.'}</td></tr>
              ) : data.map((r: any) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{r.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{r.role ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{r.sector ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{r.email ?? '—'}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button className="text-sky-600 hover:underline text-sm" onClick={() => startEdit(r)}>Editar</button>
                    <button className="text-rose-500 hover:text-rose-700 text-sm" onClick={() => handleDelete(r.id)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
        </div>
      </div>
    </div>
  );
}
