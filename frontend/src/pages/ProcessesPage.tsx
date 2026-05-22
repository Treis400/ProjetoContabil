import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { fetchProcesses } from '../services/processService';
import type { Process } from '../types';
import { formatDate } from '../utils/format';

export function ProcessesPage() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchProcesses(status ? { status } : undefined).then(setProcesses);
  }, [status]);

  return (
    <div>
      <PageHeader
        title="Processos"
        description="Controle de prazos, responsaveis, honorarios e movimentacoes."
        action={
          <Link
            to="/processos/novo"
            className="rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
          >
            Novo processo
          </Link>
        }
      />

      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <select
          className="w-full max-w-sm rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">Todos os status</option>
          <option value="ESCRITORIO_EXECUTANDO">Escritorio Executando</option>
          <option value="PARADO_COM_CLIENTE">Parado com Cliente</option>
          <option value="CONCLUIDO">Concluido</option>
        </select>
      </div>

      <DataTable
        headers={[
          'Processo',
          'Cliente',
          'Tipo',
          'Responsavel',
          'Status',
          'Vencimento',
          'Acoes',
        ]}
      >
        {processes.map((process) => (
          <tr key={process.id} className="text-sm text-slate-600">
            <td className="px-4 py-4">
              <div>
                <p className="font-semibold text-slate-900">{process.title}</p>
                <p className="text-xs text-slate-400">{process.priority}</p>
              </div>
            </td>
            <td className="px-4 py-4">{process.client.companyName}</td>
            <td className="px-4 py-4">{process.type.replaceAll('_', ' ')}</td>
            <td className="px-4 py-4">{process.responsible?.name ?? '-'}</td>
            <td className="px-4 py-4">
              <StatusBadge value={process.status} />
            </td>
            <td className="px-4 py-4">{formatDate(process.dueDate)}</td>
            <td className="px-4 py-4">
              <div className="flex gap-2">
                <Link
                  to={`/processos/${process.id}`}
                  className="rounded-xl border border-slate-200 px-3 py-2 font-medium text-slate-700 transition hover:border-sky-400 hover:text-sky-600"
                >
                  Detalhes
                </Link>
                <Link
                  to={`/processos/${process.id}/editar`}
                  className="rounded-xl border border-slate-200 px-3 py-2 font-medium text-slate-700 transition hover:border-sky-400 hover:text-sky-600"
                >
                  Editar
                </Link>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
