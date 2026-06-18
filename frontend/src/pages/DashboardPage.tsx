import {
  AlertTriangle,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileSpreadsheet,
  PlayCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { fetchDashboardSummary } from '../services/dashboardService';
import type { DashboardSummary } from '../types';

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    fetchDashboardSummary().then(setSummary);
  }, []);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Indicadores gerais de processos, carteira de clientes e revisoes tributarias."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Processos em andamento"
          value={summary?.cards.processosEmAndamento ?? 0}
          icon={PlayCircle}
        />
        <StatCard
          title="Parados com cliente"
          value={summary?.cards.processosParadosCliente ?? 0}
          icon={Clock3}
        />
        <StatCard
          title="Concluidos"
          value={summary?.cards.processosConcluidos ?? 0}
          icon={CheckCircle2}
        />
        <StatCard
          title="Atrasados"
          value={summary?.cards.processosAtrasados ?? 0}
          icon={AlertTriangle}
        />
        <StatCard
          title="Proximos do vencimento"
          value={summary?.cards.processosProximosVencimento ?? 0}
          icon={CalendarClock}
        />
        <StatCard
          title="Empresas Simples Nacional"
          value={summary?.cards.empresasSimplesNacional ?? 0}
          icon={Building2}
        />
        <StatCard title="Empresas MEI" value={summary?.cards.empresasMei ?? 0} icon={BriefcaseBusiness} />
        <StatCard
          title="Revisoes pendentes"
          value={summary?.cards.revisoesTributariasPendentes ?? 0}
          icon={FileSpreadsheet}
        />
      </div>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Processos por responsavel</h3>
        <div className="mt-4 space-y-3">
          {(summary?.processosPorResponsavel ?? []).map((item) => (
            <div
              key={`${item.responsibleId}-${item.responsibleName}`}
              className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3"
            >
              <span className="font-medium text-slate-700">{item.responsibleName}</span>
              <span className="rounded-full bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-700">
                {item.count}
              </span>
            </div>
          ))}
          {!summary?.processosPorResponsavel.length ? (
            <p className="text-sm text-slate-500">Nenhum responsavel vinculado a processos ainda.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
