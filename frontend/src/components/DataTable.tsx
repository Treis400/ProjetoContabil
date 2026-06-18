import { ChevronDown, ChevronUp } from 'lucide-react';
import { ReactNode } from 'react';

type DataTableProps = {
  headers: Array<
    | string
    | {
        key: string;
        label: string;
        sortable?: boolean;
        sortDirection?: 'asc' | 'desc' | null;
        onSort?: () => void;
      }
  >;
  children: ReactNode;
};

export function DataTable({ headers, children }: DataTableProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {headers.map((header) => {
                const config =
                  typeof header === 'string'
                    ? { key: header, label: header, sortable: false as const }
                    : header;

                const content = (
                  <>
                    <span>{config.label}</span>
                    {config.sortable ? (
                      <span className="ml-1 inline-flex flex-col leading-none text-slate-400">
                        <ChevronUp
                          size={12}
                          className={config.sortDirection === 'asc' ? 'text-sky-600' : undefined}
                        />
                        <ChevronDown
                          size={12}
                          className={config.sortDirection === 'desc' ? 'text-sky-600' : undefined}
                        />
                      </span>
                    ) : null}
                  </>
                );

                return (
                <th
                  key={config.key}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
                >
                  {config.sortable ? (
                    <button
                      type="button"
                      onClick={config.onSort}
                      className="inline-flex items-center text-left transition hover:text-sky-600"
                    >
                      {content}
                    </button>
                  ) : (
                    content
                  )}
                </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">{children}</tbody>
        </table>
      </div>
    </div>
  );
}
