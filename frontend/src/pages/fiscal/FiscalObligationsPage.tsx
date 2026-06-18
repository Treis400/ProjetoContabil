import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../../components/PageHeader';
import {
  fetchObligations,
  createObligationApi,
  generateObligationApi,
  markTransmittedApi,
  markDispensedApi,
  deleteObligationApi,
  downloadObligationUrl,
  fetchBooks,
  generateBookApi,
  downloadBookUrl,
  deleteBookApi,
} from '../../services/fiscalService';
import type { FiscalBook, FiscalObligation, ObligationType, BookType } from '../../types';

const OBLIGATION_LABELS: Record<ObligationType, string> = {
  SPED_FISCAL: 'SPED Fiscal (EFD ICMS/IPI)',
  SPED_CONTRIBUICOES: 'SPED Contribuições (EFD PIS/COFINS)',
  REINF: 'EFD-REINF',
  DCTF: 'DCTF',
  PGDAS: 'PGDAS-D',
  DAS: 'DAS',
  DIRF: 'DIRF',
  NFSE_MUNICIPAL: 'NFS-e Municipal',
  OUTRA: 'Outra',
};

const BOOK_LABELS: Record<BookType, string> = {
  ENTRADAS: 'Livro de Entradas',
  SAIDAS: 'Livro de Saídas',
  APURACAO_ICMS: 'Apuração ICMS',
  APURACAO_IPI: 'Apuração IPI',
  APURACAO_PIS_COFINS: 'Apuração PIS/COFINS',
  APURACAO_ISS: 'Apuração ISS',
};

const STATUS_CHIP: Record<string, string> = {
  PENDENTE:    'bg-yellow-100 text-yellow-700',
  GERADA:      'bg-blue-100 text-blue-700',
  TRANSMITIDA: 'bg-green-100 text-green-700',
  ERRO:        'bg-red-100 text-red-600',
  DISPENSADA:  'bg-slate-100 text-slate-500',
};

const STATUS_LABEL: Record<string, string> = {
  PENDENTE: 'Pendente', GERADA: 'Gerada', TRANSMITIDA: 'Transmitida', ERRO: 'Erro', DISPENSADA: 'Dispensada',
};

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

type Tab = 'obrigacoes' | 'livros';

type NewObForm = { clientId: string; type: ObligationType; periodMonth: number; periodYear: number; dueDate: string; notes: string };
type NewBookForm = { clientId: string; bookType: BookType; periodMonth: number; periodYear: number };

function fmtMoney(v: string | number) {
  return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

export function FiscalObligationsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('obrigacoes');
  const [clientId, setClientId] = useState('');
  const [filterYear, setFilterYear] = useState(currentYear);
  const [showObForm, setShowObForm] = useState(false);
  const [showBookForm, setShowBookForm] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);

  const [obForm, setObForm] = useState<NewObForm>({
    clientId: '', type: 'SPED_FISCAL',
    periodMonth: new Date().getMonth() + 1, periodYear: currentYear,
    dueDate: '', notes: '',
  });
  const [bookForm, setBookForm] = useState<NewBookForm>({
    clientId: '', bookType: 'ENTRADAS',
    periodMonth: new Date().getMonth() + 1, periodYear: currentYear,
  });

  // Queries
  const { data: obligations = [], isLoading: loadingOb } = useQuery({
    queryKey: ['obrigacoes', clientId, filterYear],
    queryFn: () => fetchObligations(clientId, filterYear),
    enabled: !!clientId,
  });

  const { data: books = [], isLoading: loadingBooks } = useQuery({
    queryKey: ['livros', clientId, filterYear],
    queryFn: () => fetchBooks(clientId, filterYear),
    enabled: !!clientId,
  });

  const invalidateOb   = () => qc.invalidateQueries({ queryKey: ['obrigacoes'] });
  const invalidateBook = () => qc.invalidateQueries({ queryKey: ['livros'] });

  // Mutations
  const createOb = useMutation({ mutationFn: createObligationApi, onSuccess: () => { invalidateOb(); setShowObForm(false); } });
  const createBook = useMutation({ mutationFn: generateBookApi, onSuccess: () => { invalidateBook(); setShowBookForm(false); } });
  const transmit  = useMutation({ mutationFn: markTransmittedApi, onSuccess: invalidateOb });
  const dispense  = useMutation({ mutationFn: (id: string) => markDispensedApi(id), onSuccess: invalidateOb });
  const deleteOb  = useMutation({ mutationFn: deleteObligationApi, onSuccess: invalidateOb });
  const deleteBook = useMutation({ mutationFn: deleteBookApi, onSuccess: invalidateBook });

  async function handleGenerate(id: string) {
    setGenerating(id);
    try {
      await generateObligationApi(id);
      invalidateOb();
    } catch (e: unknown) {
      alert((e as Error).message ?? 'Erro ao gerar');
    } finally {
      setGenerating(null);
    }
  }

  function downloadFile(url: string, token?: string) {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.click();
  }

  const grouped = obligations.reduce<Record<string, FiscalObligation[]>>((acc, o) => {
    const k = `${o.periodYear}-${String(o.periodMonth).padStart(2, '0')}`;
    if (!acc[k]) acc[k] = [];
    acc[k].push(o);
    return acc;
  }, {});

  const groupedBooks = books.reduce<Record<string, FiscalBook[]>>((acc, b) => {
    const k = `${b.periodYear}-${String(b.periodMonth).padStart(2, '0')}`;
    if (!acc[k]) acc[k] = [];
    acc[k].push(b);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        title="Obrigações e Livros Fiscais"
        description="SPED Fiscal, SPED Contribuições, EFD-REINF e geração de livros de entrada/saída"
        action={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setShowObForm(true); setShowBookForm(false); setTab('obrigacoes'); }}
              className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
            >
              + Nova Obrigação
            </button>
            <button
              type="button"
              onClick={() => { setShowBookForm(true); setShowObForm(false); setTab('livros'); }}
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
            >
              + Gerar Livro
            </button>
          </div>
        }
      />

      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-slate-500 mb-1">ID do Cliente</label>
          <input className="input" placeholder="Cole o ID do cliente aqui" value={clientId} onChange={(e) => setClientId(e.target.value.trim())} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Ano</label>
          <select className="input w-28" value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))}>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 w-fit">
        {(['obrigacoes', 'livros'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === t ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t === 'obrigacoes' ? 'Obrigações Acessórias' : 'Livros Fiscais'}
          </button>
        ))}
      </div>

      {/* Modal Nova Obrigação */}
      {showObForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">Nova Obrigação Acessória</h2>
            <form
              onSubmit={(e) => { e.preventDefault(); createOb.mutate({ ...obForm, clientId: obForm.clientId || clientId }); }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs text-slate-500 mb-1">ID do Cliente *</label>
                <input required className="input" value={obForm.clientId || clientId} onChange={(e) => setObForm({ ...obForm, clientId: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Tipo *</label>
                <select required className="input" value={obForm.type} onChange={(e) => setObForm({ ...obForm, type: e.target.value as ObligationType })}>
                  {Object.entries(OBLIGATION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Mês *</label>
                  <select required className="input" value={obForm.periodMonth} onChange={(e) => setObForm({ ...obForm, periodMonth: Number(e.target.value) })}>
                    {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Ano *</label>
                  <select required className="input" value={obForm.periodYear} onChange={(e) => setObForm({ ...obForm, periodYear: Number(e.target.value) })}>
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Vencimento</label>
                <input type="date" className="input" value={obForm.dueDate} onChange={(e) => setObForm({ ...obForm, dueDate: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Observações</label>
                <textarea className="input" rows={2} value={obForm.notes} onChange={(e) => setObForm({ ...obForm, notes: e.target.value })} />
              </div>
              {createOb.error && <p className="text-sm text-red-600">{(createOb.error as Error).message}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowObForm(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm">Cancelar</button>
                <button type="submit" disabled={createOb.isPending} className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                  {createOb.isPending ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Gerar Livro */}
      {showBookForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">Gerar Livro Fiscal</h2>
            <form
              onSubmit={(e) => { e.preventDefault(); createBook.mutate({ ...bookForm, clientId: bookForm.clientId || clientId }); }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs text-slate-500 mb-1">ID do Cliente *</label>
                <input required className="input" value={bookForm.clientId || clientId} onChange={(e) => setBookForm({ ...bookForm, clientId: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Tipo de Livro *</label>
                <select required className="input" value={bookForm.bookType} onChange={(e) => setBookForm({ ...bookForm, bookType: e.target.value as BookType })}>
                  {Object.entries(BOOK_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Mês *</label>
                  <select required className="input" value={bookForm.periodMonth} onChange={(e) => setBookForm({ ...bookForm, periodMonth: Number(e.target.value) })}>
                    {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Ano *</label>
                  <select required className="input" value={bookForm.periodYear} onChange={(e) => setBookForm({ ...bookForm, periodYear: Number(e.target.value) })}>
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              {createBook.error && <p className="text-sm text-red-600">{(createBook.error as Error).message}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowBookForm(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm">Cancelar</button>
                <button type="submit" disabled={createBook.isPending} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                  {createBook.isPending ? 'Gerando...' : 'Gerar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!clientId ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
          Informe o ID do cliente para visualizar
        </div>
      ) : tab === 'obrigacoes' ? (
        /* ── Obrigações ── */
        loadingOb ? <p className="text-slate-400">Carregando...</p> :
        obligations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
            Nenhuma obrigação cadastrada para {filterYear}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped)
              .sort((a, b) => b[0].localeCompare(a[0]))
              .map(([key, items]) => {
                const [year, month] = key.split('-');
                return (
                  <div key={key} className="rounded-2xl border border-slate-200 bg-white">
                    <div className="border-b border-slate-100 px-5 py-3">
                      <h3 className="font-semibold text-slate-700">{MONTHS[Number(month) - 1]} / {year}</h3>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {items.map((ob) => (
                        <div key={ob.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-sm font-semibold text-slate-800">{OBLIGATION_LABELS[ob.type]}</span>
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CHIP[ob.status]}`}>
                              {STATUS_LABEL[ob.status]}
                            </span>
                            {ob.dueDate && (
                              <span className="text-xs text-slate-400">
                                Venc: {new Date(ob.dueDate).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                            {ob.fileName && <span className="text-xs text-slate-400">{ob.fileName}</span>}
                            {ob.errorMessage && <span className="text-xs text-red-500">{ob.errorMessage}</span>}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(ob.status === 'PENDENTE' || ob.status === 'ERRO') && ['SPED_FISCAL','SPED_CONTRIBUICOES','REINF'].includes(ob.type) && (
                              <button
                                type="button"
                                onClick={() => handleGenerate(ob.id)}
                                disabled={generating === ob.id}
                                className="rounded-xl bg-sky-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-600 disabled:opacity-50"
                              >
                                {generating === ob.id ? 'Gerando...' : 'Gerar Arquivo'}
                              </button>
                            )}
                            {ob.status === 'GERADA' && (
                              <>
                                <a
                                  href={downloadObligationUrl(ob.id)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-xl border border-sky-300 px-3 py-1.5 text-xs font-medium text-sky-600 hover:bg-sky-50"
                                >
                                  Download
                                </a>
                                <button
                                  type="button"
                                  onClick={() => { if (confirm('Marcar como transmitida?')) transmit.mutate(ob.id); }}
                                  className="rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600"
                                >
                                  Transmitida
                                </button>
                              </>
                            )}
                            {ob.status === 'TRANSMITIDA' && (
                              <a
                                href={downloadObligationUrl(ob.id)}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50"
                              >
                                Download
                              </a>
                            )}
                            {ob.status === 'PENDENTE' && (
                              <button
                                type="button"
                                onClick={() => dispense.mutate(ob.id)}
                                className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50"
                              >
                                Dispensar
                              </button>
                            )}
                            {ob.status !== 'TRANSMITIDA' && (
                              <button
                                type="button"
                                onClick={() => { if (confirm('Excluir?')) deleteOb.mutate(ob.id); }}
                                className="rounded-xl border border-red-200 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50"
                              >
                                Excluir
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        )
      ) : (
        /* ── Livros ── */
        loadingBooks ? <p className="text-slate-400">Carregando...</p> :
        books.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
            Nenhum livro gerado para {filterYear}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedBooks)
              .sort((a, b) => b[0].localeCompare(a[0]))
              .map(([key, items]) => {
                const [year, month] = key.split('-');
                return (
                  <div key={key} className="rounded-2xl border border-slate-200 bg-white">
                    <div className="border-b border-slate-100 px-5 py-3">
                      <h3 className="font-semibold text-slate-700">{MONTHS[Number(month) - 1]} / {year}</h3>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {items.map((book) => (
                        <div key={book.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                          <div className="flex items-center gap-4 flex-wrap">
                            <span className="text-sm font-semibold text-slate-800">{BOOK_LABELS[book.bookType]}</span>
                            <span className="text-xs text-slate-500">
                              {book.totalEntries > 0 && `${book.totalEntries} entradas`}
                              {book.totalEntries > 0 && book.totalSaidas > 0 && ' · '}
                              {book.totalSaidas > 0 && `${book.totalSaidas} saídas`}
                            </span>
                            {Number(book.totalValueEntries) > 0 && (
                              <span className="text-xs text-slate-500">
                                Entradas: R$ {fmtMoney(book.totalValueEntries)}
                              </span>
                            )}
                            {Number(book.totalValueSaidas) > 0 && (
                              <span className="text-xs text-slate-500">
                                Saídas: R$ {fmtMoney(book.totalValueSaidas)}
                              </span>
                            )}
                            <span className="text-xs text-slate-400">
                              {new Date(book.generatedAt).toLocaleString('pt-BR')}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <a
                              href={downloadBookUrl(book.id)}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-xl border border-sky-300 px-3 py-1.5 text-xs font-medium text-sky-600 hover:bg-sky-50"
                            >
                              Download
                            </a>
                            <button
                              type="button"
                              onClick={() => { if (confirm('Excluir livro?')) deleteBook.mutate(book.id); }}
                              className="rounded-xl border border-red-200 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50"
                            >
                              Excluir
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        )
      )}
    </div>
  );
}
