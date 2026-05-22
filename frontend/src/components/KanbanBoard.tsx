import { useMemo } from 'react';
import type { Process } from '../types';
import { formatDate } from '../utils/format';
import { StatusBadge } from './StatusBadge';

type KanbanBoardProps = {
  data: Record<string, Process[]>;
  onMove: (process: Process, nextStatus: Process['status']) => Promise<void>;
};

const columns: Array<{ key: Process['status']; title: string }> = [
  { key: 'ESCRITORIO_EXECUTANDO', title: 'Escritorio Executando' },
  { key: 'PARADO_COM_CLIENTE', title: 'Parado com Cliente' },
  { key: 'CONCLUIDO', title: 'Concluido' },
];

export function KanbanBoard({ data, onMove }: KanbanBoardProps) {
  const normalized = useMemo(
    () =>
      columns.reduce<Record<string, Process[]>>((accumulator, column) => {
        accumulator[column.key] = data[column.key] ?? [];
        return accumulator;
      }, {}),
    [data],
  );

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {columns.map((column) => (
        <section key={column.key} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">{column.title}</h3>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
              {normalized[column.key].length}
            </span>
          </div>

          <div className="space-y-3">
            {normalized[column.key].map((process) => (
              <article
                key={process.id}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData('processId', process.id);
                  event.dataTransfer.setData('sourceStatus', process.status);
                }}
                onDrop={() => undefined}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-slate-900">{process.title}</h4>
                    <p className="text-sm text-slate-500">{process.client.companyName}</p>
                  </div>
                  <StatusBadge value={process.priority} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <StatusBadge value={process.status} />
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {process.type.replaceAll('_', ' ')}
                  </span>
                </div>
                <p className="mt-4 text-sm text-slate-500">
                  Vencimento: {formatDate(process.dueDate)}
                </p>
                <div className="mt-4 grid grid-cols-1 gap-2">
                  {columns
                    .filter((item) => item.key !== process.status)
                    .map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => onMove(process, item.key)}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-400 hover:text-sky-600"
                      >
                        Mover para {item.title}
                      </button>
                    ))}
                </div>
              </article>
            ))}

            <div
              onDragOver={(event) => event.preventDefault()}
              onDrop={async (event) => {
                event.preventDefault();
                const processId = event.dataTransfer.getData('processId');
                const sourceStatus = event.dataTransfer.getData('sourceStatus');
                if (!processId || sourceStatus === column.key) {
                  return;
                }

                const process = Object.values(normalized)
                  .flat()
                  .find((item) => item.id === processId);

                if (process) {
                  await onMove(process, column.key);
                }
              }}
              className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-400"
            >
              Arraste um card para esta coluna
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
