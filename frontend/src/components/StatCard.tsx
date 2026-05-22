type StatCardProps = {
  title: string;
  value: number | string;
  helper?: string;
};

export function StatCard({ title, value, helper }: StatCardProps) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h3 className="mt-3 text-3xl font-semibold text-slate-950">{value}</h3>
      {helper ? <p className="mt-2 text-sm text-slate-400">{helper}</p> : null}
    </article>
  );
}
