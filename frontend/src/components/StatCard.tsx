import type { LucideIcon } from 'lucide-react';

type StatCardProps = {
  title: string;
  value: number | string;
  helper?: string;
  icon?: LucideIcon;
};

export function StatCard({ title, value, helper, icon: Icon }: StatCardProps) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        {Icon ? (
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
            <Icon size={22} />
          </span>
        ) : null}
      </div>
      <h3 className="mt-3 text-3xl font-semibold text-slate-950">{value}</h3>
      {helper ? <p className="mt-2 text-sm text-slate-400">{helper}</p> : null}
    </article>
  );
}
