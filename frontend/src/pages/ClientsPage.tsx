import { CheckCircle2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { fetchClients } from '../services/clientService';
import type { Client } from '../types';
import { formatCnpj, formatCurrency } from '../utils/format';

type SortField = 'companyName' | 'cnpj' | 'taxRegime' | 'companyStatus' | 'monthlyFee' | 'processes';
type SortDirection = 'asc' | 'desc';

export function ClientsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [clients, setClients] = useState<Client[]>([]);
  const [companyNameFilter, setCompanyNameFilter] = useState('');
  const [cnpjFilter, setCnpjFilter] = useState('');
  const [taxRegimeFilter, setTaxRegimeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('companyName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [successMessage, setSuccessMessage] = useState(
    (location.state as { successMessage?: string } | null)?.successMessage ?? '',
  );

  useEffect(() => {
    fetchClients().then(setClients);
  }, []);

  useEffect(() => {
    const message = (location.state as { successMessage?: string } | null)?.successMessage ?? '';
    setSuccessMessage(message);
  }, [location.state]);

  function closeSuccessAlert() {
    setSuccessMessage('');
    navigate(location.pathname, { replace: true, state: null });
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortField(field);
    setSortDirection('asc');
  }

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesCompanyName = companyNameFilter
        ? client.companyName.toLowerCase().includes(companyNameFilter.toLowerCase())
        : true;
      const matchesCnpj = cnpjFilter ? client.cnpj.includes(cnpjFilter.replace(/\D/g, '')) : true;
      const matchesTaxRegime = taxRegimeFilter
        ? (client.taxRegime ?? '').toLowerCase().includes(taxRegimeFilter.toLowerCase())
        : true;
      const matchesStatus = statusFilter ? client.companyStatus === statusFilter : true;

      return matchesCompanyName && matchesCnpj && matchesTaxRegime && matchesStatus;
    });
  }, [clients, companyNameFilter, cnpjFilter, taxRegimeFilter, statusFilter]);

  const sortedClients = useMemo(() => {
    return [...filteredClients].sort((left, right) => {
      let comparison = 0;

      switch (sortField) {
        case 'companyName':
          comparison = left.companyName.localeCompare(right.companyName, 'pt-BR');
          break;
        case 'cnpj':
          comparison = left.cnpj.localeCompare(right.cnpj, 'pt-BR');
          break;
        case 'taxRegime':
          comparison = (left.taxRegime ?? '').localeCompare(right.taxRegime ?? '', 'pt-BR');
          break;
        case 'companyStatus':
          comparison = left.companyStatus.localeCompare(right.companyStatus, 'pt-BR');
          break;
        case 'monthlyFee':
          comparison =
            Number(left.monthlyFees?.[0]?.amount ?? 0) - Number(right.monthlyFees?.[0]?.amount ?? 0);
          break;
        case 'processes':
          comparison = (left._count?.processes ?? 0) - (right._count?.processes ?? 0);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredClients, sortDirection, sortField]);

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

      {successMessage ? (
        <div className="mb-6 rounded-3xl border border-sky-200 bg-gradient-to-r from-sky-50 to-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
                <CheckCircle2 size={20} />
              </span>
              <div>
                <h3 className="text-base font-semibold text-sky-950">{successMessage}</h3>
                <p className="mt-1 text-sm text-slate-600">
                  A lista ja foi atualizada com os dados mais recentes do cliente.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeSuccessAlert}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-sky-100 hover:text-sky-700"
              aria-label="Fechar alerta de sucesso"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2 xl:grid-cols-4">
        <input
          placeholder="Filtrar por razao social"
          className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400"
          value={companyNameFilter}
          onChange={(event) => setCompanyNameFilter(event.target.value)}
        />
        <input
          placeholder="Filtrar por CNPJ"
          className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400"
          value={cnpjFilter}
          onChange={(event) => setCnpjFilter(event.target.value)}
        />
        <input
          placeholder="Filtrar por regime"
          className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400"
          value={taxRegimeFilter}
          onChange={(event) => setTaxRegimeFilter(event.target.value)}
        />
        <select
          className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="">Todos os status</option>
          <option value="ATIVA">Ativa</option>
          <option value="SUSPENSA">Suspensa</option>
          <option value="INATIVA">Inativa</option>
          <option value="ENCERRADA">Encerrada</option>
        </select>
      </div>

      <DataTable
        headers={[
          {
            key: 'companyName',
            label: 'Razao Social',
            sortable: true,
            sortDirection: sortField === 'companyName' ? sortDirection : null,
            onSort: () => handleSort('companyName'),
          },
          {
            key: 'cnpj',
            label: 'CNPJ',
            sortable: true,
            sortDirection: sortField === 'cnpj' ? sortDirection : null,
            onSort: () => handleSort('cnpj'),
          },
          {
            key: 'taxRegime',
            label: 'Regime',
            sortable: true,
            sortDirection: sortField === 'taxRegime' ? sortDirection : null,
            onSort: () => handleSort('taxRegime'),
          },
          {
            key: 'companyStatus',
            label: 'Status',
            sortable: true,
            sortDirection: sortField === 'companyStatus' ? sortDirection : null,
            onSort: () => handleSort('companyStatus'),
          },
          {
            key: 'monthlyFee',
            label: 'Mensalidade',
            sortable: true,
            sortDirection: sortField === 'monthlyFee' ? sortDirection : null,
            onSort: () => handleSort('monthlyFee'),
          },
          {
            key: 'processes',
            label: 'Processos',
            sortable: true,
            sortDirection: sortField === 'processes' ? sortDirection : null,
            onSort: () => handleSort('processes'),
          },
          'Acoes',
        ]}
      >
        {sortedClients.map((client) => {
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
