import { useEffect, useMemo, useState } from 'react';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { fetchAlerts, resolveAlert } from '../services/alertService';
import type { Alert } from '../types';
import { formatDate } from '../utils/format';

type SortField = 'title' | 'severity' | 'client' | 'dueDate' | 'status';
type SortDirection = 'asc' | 'desc';

export function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('dueDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [clientFilter, setClientFilter] = useState('');
  const [dueDateFilter, setDueDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  async function loadAlerts() {
    const data = await fetchAlerts();
    setAlerts(data);
  }

  useEffect(() => {
    loadAlerts();
  }, []);

  async function handleResolve(id: string) {
    setResolvingId(id);

    try {
      await resolveAlert(id);
      await loadAlerts();
    } finally {
      setResolvingId(null);
    }
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortField(field);
    setSortDirection('asc');
  }

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchesClient = clientFilter
        ? (alert.client?.companyName ?? '').toLowerCase().includes(clientFilter.toLowerCase())
        : true;
      const matchesDueDate = dueDateFilter ? (alert.dueDate ?? '').slice(0, 10) === dueDateFilter : true;
      const matchesStatus =
        statusFilter === ''
          ? true
          : statusFilter === 'RESOLVIDO'
            ? alert.resolved
            : !alert.resolved;

      return matchesClient && matchesDueDate && matchesStatus;
    });
  }, [alerts, clientFilter, dueDateFilter, statusFilter]);

  const sortedAlerts = useMemo(() => {
    const severityOrder = {
      INFO: 0,
      WARNING: 1,
      CRITICAL: 2,
    } satisfies Record<Alert['severity'], number>;

    return [...filteredAlerts].sort((left, right) => {
      let comparison = 0;

      switch (sortField) {
        case 'title':
          comparison = left.title.localeCompare(right.title, 'pt-BR');
          break;
        case 'severity':
          comparison = severityOrder[left.severity] - severityOrder[right.severity];
          break;
        case 'client':
          comparison = (left.client?.companyName ?? '').localeCompare(right.client?.companyName ?? '', 'pt-BR');
          break;
        case 'dueDate':
          comparison =
            new Date(left.dueDate ?? '9999-12-31').getTime() -
            new Date(right.dueDate ?? '9999-12-31').getTime();
          break;
        case 'status':
          comparison = Number(left.resolved) - Number(right.resolved);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredAlerts, sortDirection, sortField]);

  return (
    <div>
      <PageHeader
        title="Alertas"
        description="Acompanhe prazos, pendencias e itens que precisam de tratativa da equipe."
      />

      <div className="mb-6 grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-3">
        <input
          placeholder="Filtrar por cliente"
          className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400"
          value={clientFilter}
          onChange={(event) => setClientFilter(event.target.value)}
        />
        <input
          type="date"
          className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400"
          value={dueDateFilter}
          onChange={(event) => setDueDateFilter(event.target.value)}
        />
        <select
          className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="">Todos os status</option>
          <option value="PENDENTE">Pendente</option>
          <option value="RESOLVIDO">Resolvido</option>
        </select>
      </div>

      <DataTable
        headers={[
          {
            key: 'title',
            label: 'Titulo',
            sortable: true,
            sortDirection: sortField === 'title' ? sortDirection : null,
            onSort: () => handleSort('title'),
          },
          {
            key: 'severity',
            label: 'Severidade',
            sortable: true,
            sortDirection: sortField === 'severity' ? sortDirection : null,
            onSort: () => handleSort('severity'),
          },
          {
            key: 'client',
            label: 'Cliente',
            sortable: true,
            sortDirection: sortField === 'client' ? sortDirection : null,
            onSort: () => handleSort('client'),
          },
          'Processo',
          {
            key: 'dueDate',
            label: 'Vencimento',
            sortable: true,
            sortDirection: sortField === 'dueDate' ? sortDirection : null,
            onSort: () => handleSort('dueDate'),
          },
          {
            key: 'status',
            label: 'Status',
            sortable: true,
            sortDirection: sortField === 'status' ? sortDirection : null,
            onSort: () => handleSort('status'),
          },
        ]}
      >
        {sortedAlerts.map((alert) => (
          <tr key={alert.id} className="text-sm text-slate-600">
            <td className="px-4 py-4 font-medium text-slate-900">
              <div>{alert.title}</div>
              {alert.description ? <div className="mt-1 text-xs text-slate-500">{alert.description}</div> : null}
            </td>
            <td className="px-4 py-4">
              <StatusBadge value={alert.severity} />
            </td>
            <td className="px-4 py-4">{alert.client?.companyName ?? '-'}</td>
            <td className="px-4 py-4">{alert.process?.title ?? '-'}</td>
            <td className="px-4 py-4">{formatDate(alert.dueDate)}</td>
            <td className="px-4 py-4">
              {alert.resolved ? (
                <StatusBadge value="CONCLUIDO" />
              ) : (
                <button
                  type="button"
                  onClick={() => handleResolve(alert.id)}
                  disabled={resolvingId === alert.id}
                  className="rounded-xl bg-sky-500 px-3 py-2 font-medium text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {resolvingId === alert.id ? 'Resolvendo...' : 'Marcar como resolvido'}
                </button>
              )}
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
