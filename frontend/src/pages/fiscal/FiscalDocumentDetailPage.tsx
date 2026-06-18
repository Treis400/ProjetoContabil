import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Clock, ArrowLeft } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { fetchFiscalDocument, revalidateFiscalDocument } from '../../services/fiscalService';
import type { FiscalDocument, ValidationStatus } from '../../types';
import { formatDate } from '../../utils/format';

const DOC_LABELS: Record<string, string> = {
  NF_E: 'NF-e', NFC_E: 'NFC-e', CT_E: 'CT-e', NFS_E: 'NFS-e',
  PRODUTOR: 'Produtor', ENERGIA: 'Energia', TELECOM: 'Telecom',
  COMBUSTIVEL: 'Combustível', OUTRO: 'Outro',
};

function Badge({ label, className }: { label: string; className: string }) {
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>{label}</span>;
}

function ValidationIcon({ status }: { status: ValidationStatus }) {
  if (status === 'VALIDO') return <CheckCircle size={16} className="text-emerald-500" />;
  if (status === 'PENDENTE') return <Clock size={16} className="text-slate-400" />;
  return <AlertTriangle size={16} className={status === 'ERRO' ? 'text-rose-500' : 'text-amber-500'} />;
}

function R(v: string | number) {
  return `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

export function FiscalDocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<FiscalDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [revalidating, setRevalidating] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchFiscalDocument(id).then(setDoc).finally(() => setLoading(false));
  }, [id]);

  async function handleRevalidate() {
    if (!id) return;
    setRevalidating(true);
    const updated = await revalidateFiscalDocument(id);
    setDoc(updated);
    setRevalidating(false);
  }

  if (loading) return <div className="py-16 text-center text-sm text-slate-400">Carregando...</div>;
  if (!doc) return <div className="py-16 text-center text-sm text-slate-400">Documento não encontrado.</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title={`${DOC_LABELS[doc.documentType] ?? doc.documentType} ${doc.series ? `${doc.series}/` : ''}${doc.documentNumber}`}
        description={`Emitido em ${formatDate(doc.issueDate)} — ${doc.nameIssuer}`}
        action={
          <div className="flex gap-2">
            <button onClick={handleRevalidate} disabled={revalidating}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">
              {revalidating ? 'Revalidando...' : 'Revalidar'}
            </button>
            <button onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              <ArrowLeft size={14} /> Voltar
            </button>
          </div>
        }
      />

      {/* Status e validação */}
      <div className="flex flex-wrap gap-3">
        <Badge
          label={doc.entryExit === 'ENTRADA' ? 'Entrada' : 'Saída'}
          className={doc.entryExit === 'ENTRADA' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}
        />
        <Badge
          label={doc.status}
          className={doc.status === 'REGULAR' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}
        />
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-0.5 text-xs font-medium text-slate-700">
          <ValidationIcon status={doc.validationStatus} />
          {doc.validationStatus}
        </span>
        <Badge
          label={doc.origin === 'XML_IMPORTADO' ? 'XML Importado' : doc.origin === 'DIGITACAO_MANUAL' ? 'Digitação manual' : 'Importação automática'}
          className="bg-slate-100 text-slate-600"
        />
      </div>

      {/* Alertas de validação */}
      {doc.validationErrors && doc.validationErrors.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="mb-2 text-sm font-semibold text-amber-800">Ocorrências de validação</p>
          <ul className="space-y-1">
            {doc.validationErrors.map((e, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-amber-700">
                <span className={`mt-0.5 rounded px-1 py-0.5 text-[10px] font-semibold ${e.severity === 'ERRO' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                  {e.severity}
                </span>
                {e.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Chave de acesso */}
      {doc.accessKey && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 mb-1">Chave de acesso</p>
          <p className="font-mono text-xs text-slate-700 break-all">{doc.accessKey}</p>
        </div>
      )}

      {/* Emitente / Destinatário */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Emitente</p>
          <p className="text-sm font-semibold text-slate-800">{doc.nameIssuer}</p>
          <p className="text-xs text-slate-500">{doc.cnpjIssuer} {doc.ufIssuer ? `— ${doc.ufIssuer}` : ''}</p>
          {doc.stateRegIssuer && <p className="text-xs text-slate-500">IE: {doc.stateRegIssuer}</p>}
        </div>
        {doc.nameRecipient && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Destinatário</p>
            <p className="text-sm font-semibold text-slate-800">{doc.nameRecipient}</p>
            <p className="text-xs text-slate-500">{doc.cnpjRecipient} {doc.ufRecipient ? `— ${doc.ufRecipient}` : ''}</p>
          </div>
        )}
      </div>

      {/* Totais */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Totais</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
          {[
            ['Produtos', doc.totalProducts],
            ['Frete', doc.totalFreight],
            ['Total NF', doc.totalDocument],
            ['Base ICMS', doc.baseIcms],
            ['Valor ICMS', doc.valueIcms],
            ['ICMS ST', doc.valueIcmsSt],
            ['IPI', doc.valueIpi],
            ['PIS', doc.valuePis],
            ['COFINS', doc.valueCofins],
            ['ISS', doc.valueIss],
          ].map(([label, value]) => (
            <div key={label as string}>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-sm font-semibold text-slate-800">{R(value as string)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Itens */}
      {doc.items && doc.items.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <p className="border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Itens ({doc.items.length})
          </p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
                  <th className="px-4 py-2">#</th>
                  <th className="px-4 py-2">Descrição</th>
                  <th className="px-4 py-2">NCM</th>
                  <th className="px-4 py-2">CFOP</th>
                  <th className="px-4 py-2">Qtd</th>
                  <th className="px-4 py-2">Vl. Unit.</th>
                  <th className="px-4 py-2">Total</th>
                  <th className="px-4 py-2">CST ICMS</th>
                  <th className="px-4 py-2">Vl. ICMS</th>
                  <th className="px-4 py-2">Vl. PIS</th>
                  <th className="px-4 py-2">Vl. COF.</th>
                </tr>
              </thead>
              <tbody>
                {doc.items.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-xs text-slate-500">{item.itemNumber}</td>
                    <td className="px-4 py-2.5 text-sm text-slate-700 max-w-48 truncate" title={item.description}>{item.description}</td>
                    <td className="px-4 py-2.5 text-xs font-mono text-slate-600">{item.ncm ?? '—'}</td>
                    <td className="px-4 py-2.5 text-xs font-mono text-slate-600">{item.cfop}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-600">{Number(item.quantity).toFixed(4)}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-600">{R(item.unitValue)}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-slate-800">{R(item.totalValue)}</td>
                    <td className="px-4 py-2.5 text-xs font-mono text-slate-600">{item.cstIcms ?? item.csosnIcms ?? '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-600">{R(item.valueIcms)}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-600">{R(item.valuePis)}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-600">{R(item.valueCofins)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {doc.notes && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-1 text-xs font-semibold text-slate-500">Observações</p>
          <p className="text-sm text-slate-700">{doc.notes}</p>
        </div>
      )}
    </div>
  );
}
