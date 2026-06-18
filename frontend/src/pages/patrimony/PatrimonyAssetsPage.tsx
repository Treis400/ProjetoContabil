import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import * as svc from '../../services/patrimonyService';
import * as clientSvc from '../../services/clientService';

const STATUS_LABEL: Record<string, string> = {
  ATIVO: 'Ativo', EM_MANUTENCAO: 'Em Manutenção', OCIOSO: 'Ocioso',
  ARRENDADO: 'Arrendado', CEDIDO: 'Cedido', BAIXADO: 'Baixado',
};
const STATUS_COLOR: Record<string, string> = {
  ATIVO: 'bg-green-50 text-green-700', EM_MANUTENCAO: 'bg-yellow-50 text-yellow-700',
  OCIOSO: 'bg-slate-100 text-slate-600', ARRENDADO: 'bg-sky-50 text-sky-700',
  CEDIDO: 'bg-purple-50 text-purple-700', BAIXADO: 'bg-red-50 text-red-700',
};

export function PatrimonyAssetsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [clientId, setClientId] = useState('');
  const [assets, setAssets] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { clientSvc.fetchClients().then(setClients); }, []);

  useEffect(() => {
    if (!clientId) return;
    svc.listGroups(clientId).then(setGroups);
    load();
  }, [clientId]);

  async function load() {
    if (!clientId) return;
    setLoading(true);
    try { setAssets(await svc.listAssets(clientId, { status: filterStatus || undefined, groupId: filterGroup || undefined })); }
    finally { setLoading(false); }
  }

  const fmt = (v: any) => Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bens Patrimoniais"
        description="Cadastro e controle do ativo imobilizado"
        action={clientId ? <Link to={`/patrimonio/bens/novo?clientId=${clientId}`} className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600">+ Novo Bem</Link> : undefined}
      />

      <div className="flex flex-wrap gap-3">
        <select className="input" value={clientId} onChange={e => setClientId(e.target.value)}>
          <option value="">Selecione a empresa...</option>
          {clients.map((c: any) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
        </select>
        <select className="input w-40" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="input w-52" value={filterGroup} onChange={e => setFilterGroup(e.target.value)}>
          <option value="">Todos os grupos</option>
          {groups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <button className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600" onClick={load}>Filtrar</button>
      </div>

      <DataTable headers={['Tombamento', 'Descrição', 'Grupo', 'Localização', 'Aquisição', 'Valor', 'Status']}>
        {loading ? (
          <tr><td colSpan={7} className="py-8 text-center text-sm text-slate-400">Carregando...</td></tr>
        ) : assets.length === 0 ? (
          <tr><td colSpan={7} className="py-8 text-center text-sm text-slate-400">{clientId ? 'Nenhum bem encontrado.' : 'Selecione uma empresa.'}</td></tr>
        ) : assets.map((r: any) => (
          <tr key={r.id} className="hover:bg-slate-50">
            <td className="px-4 py-3 text-sm font-medium text-sky-600 hover:text-sky-800">
              <Link to={`/patrimonio/bens/${r.id}`}>{r.tombamento}</Link>
            </td>
            <td className="px-4 py-3 text-sm text-slate-900">{r.description}</td>
            <td className="px-4 py-3 text-sm text-slate-600">{r.group?.name ?? '—'}</td>
            <td className="px-4 py-3 text-sm text-slate-600">{r.location?.name ?? '—'}</td>
            <td className="px-4 py-3 text-sm text-slate-600">{new Date(r.acquisitionDate).toLocaleDateString('pt-BR')}</td>
            <td className="px-4 py-3 text-sm text-slate-900">{fmt(r.acquisitionValue)}</td>
            <td className="px-4 py-3"><span className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[r.status]}`}>{STATUS_LABEL[r.status]}</span></td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
