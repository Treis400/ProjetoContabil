import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../../components/PageHeader';
import {
  fetchApuration,
  calcApurationApi,
  closeApurationApi,
  reopenApurationApi,
  addAdjustmentApi,
  removeAdjustmentApi,
  upsertSimplesRevenueApi,
} from '../../services/fiscalService';
import type { AdjustmentType } from '../../types';

const TAX_LABELS: Record<string, string> = {
  ICMS: 'ICMS',
  IPI: 'IPI',
  PIS_COFINS: 'PIS/COFINS',
  ISS: 'ISS',
  SIMPLES_NACIONAL: 'Simples Nacional',
};

const ADJUSTMENT_LABELS: Record<AdjustmentType, string> = {
  OUTROS_CREDITOS: 'Outros Créditos',
  OUTROS_DEBITOS: 'Outros Débitos',
  ESTORNO_CREDITO: 'Estorno de Crédito',
  ESTORNO_DEBITO: 'Estorno de Débito',
  INCENTIVO_FISCAL: 'Incentivo Fiscal',
  DEDUCAO: 'Dedução',
};

const MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

const SIMPLES_ANNEXES = ['I', 'II', 'III', 'IV', 'V'];

function fmt(v: string | number | undefined | null) {
  return Number(v ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Row({ label, value, bold }: { label: string; value: string | number | null | undefined; bold?: boolean }) {
  return (
    <div className={`flex justify-between py-2 text-sm ${bold ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
      <span>{label}</span>
      <span>R$ {fmt(value)}</span>
    </div>
  );
}

export function TaxApurationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [showAdjForm, setShowAdjForm] = useState(false);
  const [adjForm, setAdjForm] = useState({ type: 'OUTROS_CREDITOS' as AdjustmentType, description: '', value: '', documentRef: '' });
  const [editingAnnex, setEditingAnnex] = useState<string | null>(null);
  const [annexForm, setAnnexForm] = useState({ totalRevenue: '', revenueWithSt: '', revenueMonophasic: '', revenueIssRetained: '' });

  const { data: ap, isLoading, error } = useQuery({
    queryKey: ['apuracao', id],
    queryFn: () => fetchApuration(id!),
    enabled: !!id,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['apuracao', id] });

  const calc = useMutation({ mutationFn: () => calcApurationApi(id!), onSuccess: invalidate });
  const close = useMutation({ mutationFn: () => closeApurationApi(id!), onSuccess: invalidate });
  const reopen = useMutation({ mutationFn: () => reopenApurationApi(id!), onSuccess: invalidate });

  const addAdj = useMutation({
    mutationFn: () => addAdjustmentApi(id!, { ...adjForm, value: Number(adjForm.value) }),
    onSuccess: () => { invalidate(); setShowAdjForm(false); setAdjForm({ type: 'OUTROS_CREDITOS', description: '', value: '', documentRef: '' }); },
  });

  const removeAdj = useMutation({
    mutationFn: (adjId: string) => removeAdjustmentApi(id!, adjId),
    onSuccess: invalidate,
  });

  const saveAnnex = useMutation({
    mutationFn: (annex: string) => upsertSimplesRevenueApi(id!, {
      annex,
      totalRevenue: Number(annexForm.totalRevenue),
      revenueWithSt: Number(annexForm.revenueWithSt),
      revenueMonophasic: Number(annexForm.revenueMonophasic),
      revenueIssRetained: Number(annexForm.revenueIssRetained),
    }),
    onSuccess: () => { invalidate(); setEditingAnnex(null); },
  });

  if (isLoading) return <p className="p-8 text-slate-400">Carregando...</p>;
  if (error || !ap) return <p className="p-8 text-red-500">Apuração não encontrada.</p>;

  const r = ap.result;
  const isOpen = ap.status === 'ABERTA';
  const isCalc = ap.status === 'CALCULADA';

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Apuração ${TAX_LABELS[ap.taxType]}`}
        description={`${MONTHS[ap.periodMonth - 1]} / ${ap.periodYear} — ${ap.client?.companyName ?? ''}`}
        action={
          <div className="flex gap-2">
            {(isOpen || isCalc) && (
              <button
                type="button"
                onClick={() => calc.mutate()}
                disabled={calc.isPending}
                className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50"
              >
                {calc.isPending ? 'Calculando...' : 'Calcular'}
              </button>
            )}
            {isCalc && (
              <button
                type="button"
                onClick={() => { if (confirm('Encerrar esta apuração?')) close.mutate(); }}
                className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
              >
                Encerrar
              </button>
            )}
            {ap.status === 'ENCERRADA' && (
              <button
                type="button"
                onClick={() => reopen.mutate()}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
              >
                Reabrir
              </button>
            )}
          </div>
        }
      />

      {/* Cabeçalho info */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Status', value: ap.status === 'ABERTA' ? 'Aberta' : ap.status === 'CALCULADA' ? 'Calculada' : 'Encerrada' },
          { label: 'Período', value: `${MONTHS[ap.periodMonth - 1]}/${ap.periodYear}` },
          { label: 'Tipo', value: TAX_LABELS[ap.taxType] },
          { label: 'Criada por', value: ap.createdBy?.name ?? '—' },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-400">{label}</p>
            <p className="mt-1 font-semibold text-slate-800">{value}</p>
          </div>
        ))}
      </div>

      {/* Resultado */}
      {r && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-slate-800">Resultado do Cálculo</h2>
          <div className="divide-y divide-slate-100">
            {/* ICMS / IPI */}
            {(ap.taxType === 'ICMS' || ap.taxType === 'IPI') && (
              <>
                <Row label="Total de Débitos" value={r.totalDebits} />
                <Row label="Total de Créditos" value={r.totalCredits} />
                {ap.taxType === 'ICMS' && <Row label="ST Débitos" value={r.totalStDebits} />}
                {ap.taxType === 'ICMS' && <Row label="ST Créditos" value={r.totalStCredits} />}
                <Row label="Ajustes" value={r.totalAdjustments} />
                <Row label="Saldo Período Anterior" value={r.previousBalance} />
                <Row label="Saldo do Período" value={r.balance} />
                <Row label="Imposto a Recolher" value={r.taxDue} bold />
                <Row label="Saldo p/ Próx. Período" value={r.nextBalance} />
              </>
            )}
            {/* PIS/COFINS */}
            {ap.taxType === 'PIS_COFINS' && (
              <>
                <Row label="Base de Cálculo (Receita)" value={r.pisRevenue} />
                <Row label="PIS — Débitos" value={r.pisDebits} />
                <Row label="PIS — Créditos" value={r.pisCredits} />
                <Row label="PIS Líquido" value={r.pisNet} bold />
                <Row label="COFINS — Débitos" value={r.cofinsDebits} />
                <Row label="COFINS — Créditos" value={r.cofinsCredits} />
                <Row label="COFINS Líquido" value={r.cofinsNet} bold />
                <Row label="Total PIS + COFINS" value={Number(r.pisNet) + Number(r.cofinsNet)} bold />
              </>
            )}
            {/* ISS */}
            {ap.taxType === 'ISS' && (
              <>
                <Row label="ISS Próprio (Emissões)" value={r.issOwn} />
                <Row label="ISS Retido na Fonte" value={r.issRetained} />
                <Row label="ISS Líquido a Recolher" value={r.issNet} bold />
              </>
            )}
            {/* Simples */}
            {ap.taxType === 'SIMPLES_NACIONAL' && (
              <>
                <Row label="RBC do Mês" value={r.simplesRbcTotal} />
                <Row label="RBC Acumulado (12 meses)" value={r.simplesRbcAcum} />
                <Row label={`Alíquota Efetiva Média`} value={`${Number(r.simplesAliquota).toFixed(2)}%`} />
                <div className="flex justify-between py-2 text-sm font-semibold text-slate-900">
                  <span>DAS a Recolher</span>
                  <span>R$ {fmt(r.simplesTotalDue)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Receitas por Anexo — Simples */}
      {ap.taxType === 'SIMPLES_NACIONAL' && (isOpen || isCalc) && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-slate-800">Receitas por Anexo</h2>
          <div className="space-y-3">
            {SIMPLES_ANNEXES.map((annex) => {
              const rev = ap.simplesRevenues?.find((r) => r.annex === annex);
              if (editingAnnex === annex) {
                return (
                  <div key={annex} className="rounded-xl border border-sky-200 bg-sky-50 p-4">
                    <p className="mb-3 font-semibold text-slate-700">Anexo {annex}</p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[
                        { key: 'totalRevenue', label: 'Receita Total' },
                        { key: 'revenueWithSt', label: 'c/ Substituição' },
                        { key: 'revenueMonophasic', label: 'Monofásica' },
                        { key: 'revenueIssRetained', label: 'ISS Retido' },
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <label className="block text-xs text-slate-500 mb-1">{label}</label>
                          <input
                            type="number"
                            step="0.01"
                            className="input"
                            value={annexForm[key as keyof typeof annexForm]}
                            onChange={(e) => setAnnexForm({ ...annexForm, [key]: e.target.value })}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button type="button" onClick={() => saveAnnex.mutate(annex)} className="rounded-xl bg-sky-500 px-3 py-1.5 text-xs font-medium text-white">Salvar</button>
                      <button type="button" onClick={() => setEditingAnnex(null)} className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs">Cancelar</button>
                    </div>
                  </div>
                );
              }
              return (
                <div key={annex} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
                  <div className="flex gap-6 text-sm">
                    <span className="font-semibold text-slate-700">Anexo {annex}</span>
                    <span className="text-slate-500">Total: <strong>R$ {fmt(rev?.totalRevenue)}</strong></span>
                    {rev && <span className="text-slate-500">Líquida: <strong>R$ {fmt(rev.netRevenue)}</strong></span>}
                  </div>
                  {isOpen && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAnnex(annex);
                        setAnnexForm({
                          totalRevenue: rev?.totalRevenue ?? '',
                          revenueWithSt: rev?.revenueWithSt ?? '',
                          revenueMonophasic: rev?.revenueMonophasic ?? '',
                          revenueIssRetained: rev?.revenueIssRetained ?? '',
                        });
                      }}
                      className="text-xs text-sky-600 hover:underline"
                    >
                      Editar
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ajustes */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">Ajustes</h2>
          {isOpen && (
            <button
              type="button"
              onClick={() => setShowAdjForm(true)}
              className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
            >
              + Adicionar
            </button>
          )}
        </div>

        {showAdjForm && (
          <div className="mb-4 rounded-xl border border-slate-200 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Tipo</label>
                <select className="input" value={adjForm.type} onChange={(e) => setAdjForm({ ...adjForm, type: e.target.value as AdjustmentType })}>
                  {Object.entries(ADJUSTMENT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Valor (R$)</label>
                <input type="number" step="0.01" className="input" value={adjForm.value} onChange={(e) => setAdjForm({ ...adjForm, value: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-slate-500 mb-1">Descrição *</label>
                <input required className="input" value={adjForm.description} onChange={(e) => setAdjForm({ ...adjForm, description: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-slate-500 mb-1">Documento de Referência</label>
                <input className="input" value={adjForm.documentRef} onChange={(e) => setAdjForm({ ...adjForm, documentRef: e.target.value })} />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => addAdj.mutate()} className="rounded-xl bg-sky-500 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50" disabled={addAdj.isPending}>
                Salvar
              </button>
              <button type="button" onClick={() => setShowAdjForm(false)} className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs">Cancelar</button>
            </div>
          </div>
        )}

        {!ap.adjustments?.length ? (
          <p className="text-sm text-slate-400">Nenhum ajuste cadastrado.</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {ap.adjustments.map((adj) => (
              <div key={adj.id} className="flex items-center justify-between py-3">
                <div>
                  <span className="text-sm font-medium text-slate-700">{ADJUSTMENT_LABELS[adj.type]}</span>
                  <span className="ml-3 text-sm text-slate-500">{adj.description}</span>
                  {adj.documentRef && <span className="ml-2 text-xs text-slate-400">({adj.documentRef})</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-800">R$ {fmt(adj.value)}</span>
                  {isOpen && (
                    <button
                      type="button"
                      onClick={() => { if (confirm('Remover ajuste?')) removeAdj.mutate(adj.id); }}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      Remover
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {ap.notes && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-400 mb-1">Observações</p>
          <p className="text-sm text-slate-700">{ap.notes}</p>
        </div>
      )}

      <div>
        <button type="button" onClick={() => navigate(-1)} className="text-sm text-slate-500 hover:text-slate-700">
          ← Voltar
        </button>
      </div>
    </div>
  );
}
