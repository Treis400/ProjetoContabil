import { statusLabel } from '../utils/format';

const colorMap: Record<string, string> = {
  ESCRITORIO_EXECUTANDO: 'bg-blue-100 text-blue-700',
  PARADO_COM_CLIENTE: 'bg-amber-100 text-amber-700',
  CONCLUIDO: 'bg-emerald-100 text-emerald-700',
  ATIVA: 'bg-emerald-100 text-emerald-700',
  SUSPENSA: 'bg-amber-100 text-amber-700',
  ENCERRADA: 'bg-rose-100 text-rose-700',
  CRITICAL: 'bg-rose-100 text-rose-700',
  WARNING: 'bg-amber-100 text-amber-700',
  INFO: 'bg-slate-100 text-slate-700',
};

export function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        colorMap[value] ?? 'bg-slate-100 text-slate-700'
      }`}
    >
      {statusLabel(value)}
    </span>
  );
}
