import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { fetchClients } from '../services/clientService';
import type { Client } from '../types';
import { formatCnpj, formatCurrency } from '../utils/format';

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [taxRegime, setTaxRegime] = useState('');

  useEffect(() => {
    fetchClients({
      ...(search ? { search } : {}),
      ...(taxRegime ? { taxRegime } : {}),
    }).then(setClients);
  }, [search, taxRegime]);

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Cadastro, busca e acompanhamento de clientes do escritorio."
        action={
          <Link
            to="/clientes/novo"
            className="rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
          >
            Novo cliente
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
        <input
          placeholder="Buscar por razao social, fantasia, CNPJ ou responsavel"
          className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <input
          placeholder="Filtrar por regime tributario"
          className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400"
          value={taxRegime}
          onChange={(event) => setTaxRegime(event.target.value)}
        />
      </div>

      <DataTable
        headers={[
          'Razao Social',
          'CNPJ',
          'Regime',
          'Status',
          'Mensalidade',
          'Processos',
          'Acoes',
        ]}
      >
        {clients.map((client) => {
          const currentFee = client.monthlyFees?.[0];

          return (
            <tr key={client.id} className="text-sm text-slate-600">
              <td className="px-4 py-4">
                <div>
                  <p className="font-semibold text-slate-900">{client.companyName}</p>
                  <p className="text-xs text-slate-400">{client.tradeName ?? 'Sem nome fantasia'}</p>
                </div>
              </td>
              <td className="px-4 py-4">{formatCnpj(client.cnpj)}</td>
              <td className="px-4 py-4">{client.taxRegime ?? '-'}</td>
              <td className="px-4 py-4">
                <StatusBadge value={client.companyStatus} />
              </td>
              <td className="px-4 py-4">{formatCurrency(currentFee?.amount)}</td>
              <td className="px-4 py-4">{client._count?.processes ?? 0}</td>
              <td className="px-4 py-4">
                <div className="flex gap-2">
                  <Link
                    to={`/clientes/${client.id}`}
                    className="rounded-xl border border-slate-200 px-3 py-2 font-medium text-slate-700 transition hover:border-sky-400 hover:text-sky-600"
                  >
                    Detalhes
                  </Link>
                  <Link
                    to={`/clientes/${client.id}/editar`}
                    className="rounded-xl border border-slate-200 px-3 py-2 font-medium text-slate-700 transition hover:border-sky-400 hover:text-sky-600"
                  >
                    Editar
                  </Link>
                </div>
              </td>
            </tr>
          );
        })}
      </DataTable>
    </div>
  );
}
