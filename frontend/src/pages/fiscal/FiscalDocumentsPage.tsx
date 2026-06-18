import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Plus, Upload, Search, Eye, Trash2, RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import {
  fetchFiscalDocuments,
  deleteFiscalDocumentApi,
  revalidateFiscalDocument,
  type DocumentFilters,
} from '../../services/fiscalService';
import { fetchClients } from '../../services/clientService';
import type { Client, FiscalDocument, ValidationStatus } from '../../types';
import { formatDate } from '../../utils/format';

const DOC_TYPE_LABELS: Record<string, string> = {
  NF_E: 'NF-e', NFC_E: 'NFC-e', CT_E: 'CT-e', NFS_E: 'NFS-e',
  PRODUTOR: 'Produtor', ENERGIA: 'Energia', TELECOM: 'Telecom',
  COMBUSTIVEL: 'Combustível', OUTRO: 'Outro',
};

const STATUS_LABELS: Record<string, string> = {
  REGULAR: 'Regular', CANCELADA: 'Cancelada', INUTILIZADA: 'Inutilizada', DENEGADA: 'Denegada',
};

function ValidationBadge({ status }: { status: ValidationStatus }) {
  const map: Record<ValidationStatus, { label: string; className: string; icon: React.ReactNode }> = {
    VALIDO:    { label: 'Válido',     className: 'bg-emerald-50 text-emerald-700', icon: <CheckCircle size={11} /> },
    PENDENTE:  { label: 'Pendente',   className: 'bg-slate-100 text-slate-500',    icon: <Clock size={11} /> },
    DIVERGENTE:{ label: 'Divergente', className: 'bg-amber-50 text-amber-700',     icon: <AlertTriangle size={11} /> },
    ERRO:      { label: 'Erro',       className: 'bg-rose-50 text-rose-700',       icon: <AlertTriangle size={11} /> },
  };
  const { label, className, icon } = map[status] ?? map.PENDENTE;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {icon} {label}
    </span>
  );
}

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

export function FiscalDocumentsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [clients, setClients] = useState<Client[]>([]);
  const [documents, setDocuments] = useState<FiscalDocument[]>([]);
  const [loading, setLoading] = useState(false);

  const selectedClientId = searchParams.get('clientId') ?? '';
  const [filters, setFilters] = useState<Omit<DocumentFilters, 'clientId'>>({
    entryExit: undefined,
    documentType: undefined,
    status: undefined,
    periodYear: new Date().getFullYear(),
    periodMonth: undefined,
    search: undefined,
  });
  const [search, setSearch] = useState('');

  useEffect(() => { fetchClients({}).then(setClients); }, []);

  useEffect(() => {
    if (!selectedClientId) { setDocuments([]); return; }
    setLoading(true);
    fetchFiscalDocuments({ clientId: selectedClientId, ...filters, search: search || undefined })
      .then(setDocuments)
      .finally(() => setLoading(false));
  }, [selectedClientId, filters, search]);

  async function handleDelete(id: string) {
    if (!confirm('Excluir este documento fiscal?')) return;
    await deleteFiscalDocumentApi(id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }

  async function handleRevalidate(id: string) {
    const updated = await revalidateFiscalDocument(id);
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, ...updated } : d)));
  }

  const totalEntrada = documents.filter((d) => d.entryExit === 'ENTRADA').reduce((s, d) => s + Number(d.totalDocument), 0);
  const totalSaida = documents.filter((d) => d.entryExit === 'SAIDA').reduce((s, d) => s + Number(d.totalDocument), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Escrituração de Documentos"
        description="Notas fiscais de entrada e saída escrituradas"
        action={
          selectedClientId ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/fiscal/documentos/importar?clientId=${selectedClientId}`)}
                className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100"
              >
                <Upload size={15} /> Importar XML
              </button>
              <button
                onClick={() => navigate(`/fiscal/documentos/novo?clientId=${selectedClientId}`)}
                className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
              >
                <Plus size={15} /> Digitar nota
              </button>
            </div>
          ) : undefined
        }
      />

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <select
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          value={selectedClientId}
          onChange={(e) => setSearchParams({ clientId: e.target.value })}
        >
          <option value="">Selecione um cliente...</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
        </select>

        {selectedClientId && (
          <>
            <select className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              value={filters.entryExit ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, entryExit: (e.target.value as 'ENTRADA' | 'SAIDA') || undefined }))}>
              <option value="">Entrada + Saída</option>
              <option value="ENTRADA">Entradas</option>
              <option value="SAIDA">Saídas</option>
            </select>

            <select className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              value={filters.documentType ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, documentType: e.target.value || undefined }))}>
              <option value="">Todos os tipos</option>
              {Object.entries(DOC_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>

            <select className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              value={filters.periodYear ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, periodYear: e.target.value ? Number(e.target.value) : undefined }))}>
              <option value="">Todos os anos</option>
              {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>

            <select className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              value={filters.periodMonth ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, periodMonth: e.target.value ? Number(e.target.value) : undefined }))}>
              <option value="">Todos os meses</option>
              {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>

            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm"
                placeholder="Número, CNPJ, razão social, chave..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </>
        )}
      </div>

      {/* Totalizadores */}
      {selectedClientId && documents.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Documentos', value: documents.length.toString(), color: 'text-slate-700' },
            { label: 'Total entradas', value: `R$ ${totalEntrada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, color: 'text-blue-700' },
            { label: 'Total saídas', value: `R$ ${totalSaida.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, color: 'text-emerald-700' },
            { label: 'Com erro/divergência', value: documents.filter((d) => d.validationStatus === 'ERRO' || d.validationStatus === 'DIVERGENTE').length.toString(), color: 'text-amber-700' },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">{card.label}</p>
              <p className={`mt-1 text-lg font-semibold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {!selectedClientId ? (
        <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
          <FileText size={36} className="text-slate-300" />
          <p className="text-sm">Selecione um cliente para ver os documentos</p>
        </div>
      ) : loading ? (
        <div className="py-12 text-center text-sm text-slate-400">Carregando...</div>
      ) : (
        <DataTable headers={['Tipo', 'E/S', 'Número', 'Data emissão', 'Emitente/Destinatário', 'Total', 'Situação', 'Validação', '']}>
          {documents.length === 0 ? (
            <tr><td colSpan={9} className="py-10 text-center text-sm text-slate-400">Nenhum documento encontrado.</td></tr>
          ) : (
            documents.map((doc) => (
              <tr key={doc.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                    {DOC_TYPE_LABELS[doc.documentType] ?? doc.documentType}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${doc.entryExit === 'ENTRADA' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {doc.entryExit === 'ENTRADA' ? 'E' : 'S'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-mono text-slate-700">
                  {doc.series ? `${doc.series}/` : ''}{doc.documentNumber}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{formatDate(doc.issueDate)}</td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {doc.entryExit === 'ENTRADA' ? doc.nameIssuer : (doc.nameRecipient ?? '—')}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-slate-700">
                  R$ {Number(doc.totalDocument).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${doc.status === 'REGULAR' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {STATUS_LABELS[doc.status] ?? doc.status}
                  </span>
                </td>
                <td className="px-4 py-3"><ValidationBadge status={doc.validationStatus} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => navigate(`/fiscal/documentos/${doc.id}`)} className="rounded-lg p-1.5 text-slate-400 hover:bg-sky-50 hover:text-sky-600" title="Detalhes">
                      <Eye size={14} />
                    </button>
                    <button onClick={() => handleRevalidate(doc.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-600" title="Revalidar">
                      <RefreshCw size={14} />
                    </button>
                    <button onClick={() => handleDelete(doc.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Excluir">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </DataTable>
      )}
    </div>
  );
}
