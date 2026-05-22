import { useEffect, useState } from 'react';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { fetchAlerts, resolveAlert } from '../services/alertService';
import type { Alert } from '../types';
import { formatDate } from '../utils/format';

export function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

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

  return (
    <div>
      <PageHeader
        title="Alertas"
        description="Acompanhe prazos, pendencias e itens que precisam de tratativa da equipe."
      />

      <DataTable headers={['Titulo', 'Severidade', 'Cliente', 'Processo', 'Vencimento', 'Status']}>
        {alerts.map((alert) => (
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
