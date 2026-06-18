import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../components/PageHeader';
import {
  createEntryApi,
  fetchAccounts,
  fetchCostCenters,
  fetchStandardHistories,
  fetchEntryTypes,
} from '../../services/accountingService';
import type { DebitCredit, AccountingEntryLineInput } from '../../types';

type LineForm = {
  lineNumber: number;
  accountId: string;
  accountLabel: string;
  costCenterId: string;
  historyId: string;
  complement: string;
  debitCredit: DebitCredit;
  value: string;
};

const emptyLine = (n: number): LineForm => ({
  lineNumber: n,
  accountId: '',
  accountLabel: '',
  costCenterId: '',
  historyId: '',
  complement: '',
  debitCredit: 'DEBITO',
  value: '',
});

export function AccountingEntryFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialClientId = searchParams.get('clientId') ?? '';

  const [clientId, setClientId] = useState(initialClientId);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [entryTypeId, setEntryTypeId] = useState('');
  const [documentRef, setDocumentRef] = useState('');
  const [lines, setLines] = useState<LineForm[]>([emptyLine(1), emptyLine(2)]);
  const [error, setError] = useState('');
  const [accountSearch, setAccountSearch] = useState<Record<number, string>>({});

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts', clientId],
    queryFn: () => fetchAccounts(clientId),
    enabled: !!clientId,
  });

  const { data: costCenters = [] } = useQuery({
    queryKey: ['cost-centers', clientId],
    queryFn: () => fetchCostCenters(clientId),
    enabled: !!clientId,
  });

  const { data: histories = [] } = useQuery({
    queryKey: ['standard-histories', clientId],
    queryFn: () => fetchStandardHistories(clientId),
    enabled: !!clientId,
  });

  const { data: entryTypes = [] } = useQuery({
    queryKey: ['entry-types', clientId],
    queryFn: () => fetchEntryTypes(clientId),
    enabled: !!clientId,
  });

  const analyticalAccounts = accounts.filter(a => a.allowsEntry && a.active);

  const create = useMutation({
    mutationFn: createEntryApi,
    onSuccess: (entry) => navigate(`/contabil/lancamentos/${entry.id}`),
    onError: (e: Error) => setError(e.message),
  });

  function updateLine(index: number, field: keyof LineForm, value: string) {
    setLines(prev => prev.map((l, i) => i === index ? { ...l, [field]: value } : l));
  }

  function selectAccount(index: number, accountId: string) {
    const acc = analyticalAccounts.find(a => a.id === accountId);
    setLines(prev => prev.map((l, i) =>
      i === index
        ? { ...l, accountId, accountLabel: acc ? `${acc.code} — ${acc.name}` : '' }
        : l
    ));
    setAccountSearch(prev => ({ ...prev, [index]: '' }));
  }

  function addLine() {
    setLines(prev => [...prev, emptyLine(prev.length + 1)]);
  }

  function removeLine(index: number) {
    setLines(prev => prev.filter((_, i) => i !== index).map((l, i) => ({ ...l, lineNumber: i + 1 })));
  }

  const totalDebits  = lines.filter(l => l.debitCredit === 'DEBITO').reduce((s, l)  => s + (Number(l.value) || 0), 0);
  const totalCredits = lines.filter(l => l.debitCredit === 'CREDITO').reduce((s, l) => s + (Number(l.value) || 0), 0);
  const diff = Math.abs(totalDebits - totalCredits);
  const balanced = diff < 0.005;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!clientId) { setError('Informe o ID do cliente.'); return; }
    if (!description.trim()) { setError('Informe a descrição.'); return; }

    const linesPayload: AccountingEntryLineInput[] = lines.map((l, i) => ({
      lineNumber: i + 1,
      accountId: l.accountId,
      costCenterId: l.costCenterId || null,
      historyId: l.historyId || null,
      complement: l.complement || null,
      debitCredit: l.debitCredit,
      value: Number(l.value),
    }));

    create.mutate({
      clientId,
      entryDate,
      description,
      entryTypeId: entryTypeId || null,
      documentRef: documentRef || null,
      lines: linesPayload,
    });
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  function getFilteredAccounts(idx: number) {
    const q = (accountSearch[idx] ?? '').toLowerCase();
    if (!q) return [];
    return analyticalAccounts.filter(a =>
      a.code.includes(q) || a.name.toLowerCase().includes(q)
    ).slice(0, 10);
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Novo Lançamento Contábil"
        description="Partidas dobradas — débitos devem igualar créditos"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cabeçalho */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">Dados do Lançamento</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs text-slate-500 mb-1">ID do Cliente *</label>
              <input
                className="input"
                value={clientId}
                onChange={e => setClientId(e.target.value.trim())}
                placeholder="cuid do cliente"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Data *</label>
              <input
                type="date"
                className="input"
                value={entryDate}
                onChange={e => setEntryDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Tipo de Lançamento</label>
              <select className="input" value={entryTypeId} onChange={e => setEntryTypeId(e.target.value)}>
                <option value="">— Selecione —</option>
                {entryTypes.map(t => <option key={t.id} value={t.id}>{t.code} — {t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Referência/Doc.</label>
              <input
                className="input"
                value={documentRef}
                onChange={e => setDocumentRef(e.target.value)}
                placeholder="NF-e, contrato..."
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Descrição/Histórico *</label>
            <input
              required
              className="input"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descreva o lançamento..."
            />
          </div>
        </div>

        {/* Partidas */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-slate-700">Partidas</h2>
            <button
              type="button"
              onClick={addLine}
              className="text-xs text-sky-600 hover:underline"
            >
              + Adicionar linha
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-3 py-2 text-left text-xs text-slate-500 w-8">#</th>
                  <th className="px-3 py-2 text-left text-xs text-slate-500">Conta</th>
                  <th className="px-3 py-2 text-left text-xs text-slate-500 w-32">D/C</th>
                  <th className="px-3 py-2 text-right text-xs text-slate-500 w-36">Valor (R$)</th>
                  <th className="px-3 py-2 text-left text-xs text-slate-500 w-36">Centro de Custo</th>
                  <th className="px-3 py-2 text-left text-xs text-slate-500 w-36">Histórico</th>
                  <th className="px-3 py-2 text-left text-xs text-slate-500">Complemento</th>
                  <th className="px-3 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {lines.map((line, idx) => {
                  const filtered = getFilteredAccounts(idx);
                  return (
                    <tr key={idx} className="align-top">
                      <td className="px-3 py-2 text-slate-400 text-xs pt-3">{idx + 1}</td>
                      <td className="px-3 py-2 min-w-[220px]">
                        <div className="relative">
                          {line.accountId ? (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-slate-700 flex-1">{line.accountLabel}</span>
                              <button type="button" onClick={() => updateLine(idx, 'accountId', '')} className="text-slate-300 hover:text-red-400 text-xs">×</button>
                            </div>
                          ) : (
                            <>
                              <input
                                className="input text-xs py-1.5"
                                placeholder="Código ou nome da conta..."
                                value={accountSearch[idx] ?? ''}
                                onChange={e => setAccountSearch(prev => ({ ...prev, [idx]: e.target.value }))}
                              />
                              {filtered.length > 0 && (
                                <div className="absolute left-0 top-full z-10 mt-1 w-80 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                                  {filtered.map(a => (
                                    <button
                                      key={a.id}
                                      type="button"
                                      onClick={() => selectAccount(idx, a.id)}
                                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-sky-50"
                                    >
                                      <span className="font-mono text-slate-400 w-20 shrink-0">{a.code}</span>
                                      <span className="text-slate-700 truncate">{a.name}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          className="input text-xs py-1.5 w-28"
                          value={line.debitCredit}
                          onChange={e => updateLine(idx, 'debitCredit', e.target.value)}
                        >
                          <option value="DEBITO">Débito</option>
                          <option value="CREDITO">Crédito</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="input text-xs py-1.5 text-right w-36"
                          value={line.value}
                          onChange={e => updateLine(idx, 'value', e.target.value)}
                          placeholder="0,00"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          className="input text-xs py-1.5 w-36"
                          value={line.costCenterId}
                          onChange={e => updateLine(idx, 'costCenterId', e.target.value)}
                        >
                          <option value="">—</option>
                          {costCenters.map(c => <option key={c.id} value={c.id}>{c.code} {c.name}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          className="input text-xs py-1.5 w-36"
                          value={line.historyId}
                          onChange={e => updateLine(idx, 'historyId', e.target.value)}
                        >
                          <option value="">—</option>
                          {histories.map(h => <option key={h.id} value={h.id}>{h.code} — {h.text}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="input text-xs py-1.5"
                          value={line.complement}
                          onChange={e => updateLine(idx, 'complement', e.target.value)}
                          placeholder="Complemento..."
                        />
                      </td>
                      <td className="px-3 py-2 pt-2.5">
                        {lines.length > 2 && (
                          <button type="button" onClick={() => removeLine(idx)} className="text-slate-300 hover:text-red-400 text-base leading-none">×</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t border-slate-200 bg-slate-50">
                <tr>
                  <td colSpan={3} className="px-3 py-3 text-xs text-slate-500 font-semibold text-right">Totais:</td>
                  <td className="px-3 py-3 text-right">
                    <div className="text-xs font-mono">
                      <span className="text-blue-700">D: {fmt(totalDebits)}</span>
                      <span className="mx-2 text-slate-300">|</span>
                      <span className="text-rose-700">C: {fmt(totalCredits)}</span>
                    </div>
                    {!balanced && (
                      <div className="text-xs text-red-600 mt-0.5">
                        Diferença: {fmt(diff)}
                      </div>
                    )}
                    {balanced && totalDebits > 0 && (
                      <div className="text-xs text-green-600 mt-0.5">Balanceado ✓</div>
                    )}
                  </td>
                  <td colSpan={4}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={create.isPending || !balanced || totalDebits === 0}
            className="rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50"
          >
            {create.isPending ? 'Salvando...' : 'Confirmar Lançamento'}
          </button>
        </div>
      </form>
    </div>
  );
}
