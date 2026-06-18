import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Briefcase, Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { fetchFiscalServices, deleteFiscalService } from '../../services/fiscalService';
import { fetchClients } from '../../services/clientService';
import type { FiscalService, Client } from '../../types';

export function FiscalServicesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<FiscalService[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const selectedClientId = searchParams.get('clientId') ?? '';

  useEffect(() => {
    fetchClients({}).then(setClients);
  }, []);

  useEffect(() => {
    if (!selectedClientId) {
      setServices([]);
      return;
    }
    setLoading(true);
    fetchFiscalServices(selectedClientId, search || undefined)
      .then(setServices)
      .finally(() => setLoading(false));
  }, [selectedClientId, search]);

  async function handleDelete(id: string) {
    if (!confirm('Excluir este serviço fiscal?')) return;
    await deleteFiscalService(id);
    setServices((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Serviços Fiscais"
        description="Cadastro de serviços com ISS, retenções e LC 116"
        action={
          selectedClientId ? (
            <button
              onClick={() => navigate(`/fiscal/servicos/novo?clientId=${selectedClientId}`)}
              className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
            >
              <Plus size={16} /> Novo serviço
            </button>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
          value={selectedClientId}
          onChange={(e) => setSearchParams({ clientId: e.target.value })}
        >
          <option value="">Selecione um cliente...</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.companyName}
            </option>
          ))}
        </select>

        {selectedClientId && (
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por descrição, código ou LC 116..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-700 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}
      </div>

      {!selectedClientId ? (
        <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
          <Briefcase size={36} className="text-slate-300" />
          <p className="text-sm">Selecione um cliente para ver os serviços fiscais</p>
        </div>
      ) : loading ? (
        <div className="py-12 text-center text-sm text-slate-400">Carregando...</div>
      ) : (
        <DataTable
          headers={[
            { key: 'internalCode', label: 'Código' },
            { key: 'description', label: 'Descrição' },
            { key: 'lc116Code', label: 'LC 116' },
            { key: 'municipalCode', label: 'Cód. Municipal' },
            { key: 'issRate', label: 'ISS %' },
            { key: 'issType', label: 'Tipo ISS' },
            { key: 'retentions', label: 'Retenções' },
            { key: 'active', label: 'Situação' },
            { key: 'actions', label: '' },
          ]}
        >
          {services.length === 0 ? (
            <tr>
              <td colSpan={9} className="py-10 text-center text-sm text-slate-400">
                Nenhum serviço cadastrado para este cliente.
              </td>
            </tr>
          ) : (
            services.map((s) => {
              const retentions = [
                s.hasInssRetention && 'INSS',
                s.hasIrrfRetention && 'IRRF',
                s.hasCsllRetention && 'CSLL',
                s.hasPisRetention && 'PIS',
                s.hasCofinsRetention && 'COFINS',
              ]
                .filter(Boolean)
                .join(', ');

              const issType = [
                s.issOwnRule && 'Próprio',
                s.issRetainedRule && 'Retido',
                s.issSubstituteRule && 'Substituto',
              ]
                .filter(Boolean)
                .join(', ');

              return (
                <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-mono text-slate-600">{s.internalCode}</td>
                  <td className="px-4 py-3 text-sm text-slate-800">{s.description}</td>
                  <td className="px-4 py-3 text-sm font-mono text-slate-600">{s.lc116Code ?? '—'}</td>
                  <td className="px-4 py-3 text-sm font-mono text-slate-600">{s.municipalCode ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {s.issRate ? `${Number(s.issRate).toFixed(2)}%` : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{issType || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{retentions || '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        s.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {s.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/fiscal/servicos/${s.id}/editar`)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-sky-50 hover:text-sky-600"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </DataTable>
      )}
    </div>
  );
}
