import { ChangeEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { fetchClient, uploadClientDocument } from '../services/clientService';
import { getDocumentDownloadUrl } from '../services/documentService';
import type { Client } from '../types';
import { formatCurrency, formatDate, statusLabel } from '../utils/format';

export function ClientDetailPage() {
  const { id } = useParams();
  const [client, setClient] = useState<Client | null>(null);

  async function loadClient() {
    if (!id) {
      return;
    }

    const data = await fetchClient(id);
    setClient(data);
  }

  useEffect(() => {
    loadClient();
  }, [id]);

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || !id) {
      return;
    }

    await uploadClientDocument(id, file);
    await loadClient();
  }

  const currentFee = client?.monthlyFees?.find((item) => item.isCurrent);

  return (
    <div>
      <PageHeader
        title={client?.companyName ?? 'Cliente'}
        description="Detalhes cadastrais, historico, mensalidade e documentos do cliente."
        action={
          client ? (
            <Link
              to={`/clientes/${client.id}/editar`}
              className="rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
            >
              Editar cliente
            </Link>
          ) : null
        }
      />

      {client ? (
        <div className="space-y-6">
          <section className="grid gap-4 xl:grid-cols-3">
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
              <h3 className="text-lg font-semibold text-slate-900">Resumo da empresa</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Nome Fantasia</p>
                  <p className="mt-2 font-medium text-slate-800">{client.tradeName ?? '-'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">CNPJ</p>
                  <p className="mt-2 font-medium text-slate-800">{client.cnpj}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Regime Tributario</p>
                  <p className="mt-2 font-medium text-slate-800">{client.taxRegime ?? '-'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Situacao</p>
                  <div className="mt-2">
                    <StatusBadge value={client.companyStatus} />
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Responsavel Legal</p>
                  <p className="mt-2 font-medium text-slate-800">{client.legalRepresentative ?? '-'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Mensalidade atual</p>
                  <p className="mt-2 font-medium text-slate-800">{formatCurrency(currentFee?.amount)}</p>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Tributario</h3>
              <div className="mt-4 space-y-4 text-sm text-slate-600">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Tipo</p>
                  <p className="mt-1 font-medium text-slate-800">
                    {statusLabel(client.taxProfile.companyType)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Situacao atual</p>
                  <p className="mt-1 font-medium text-slate-800">
                    {client.taxProfile.currentTaxSituation
                      ? statusLabel(client.taxProfile.currentTaxSituation)
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Certificado digital
                  </p>
                  <p className="mt-1 font-medium text-slate-800">
                    {client.taxProfile.digitalCertificate ?? '-'}
                  </p>
                  <p className="text-xs text-slate-400">
                    Vence em {formatDate(client.taxProfile.digitalCertificateExpiry)}
                  </p>
                </div>
              </div>
            </article>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Documentos</h3>
                <label className="cursor-pointer rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
                  Enviar arquivo
                  <input type="file" className="hidden" onChange={handleUpload} />
                </label>
              </div>
              <div className="mt-4 space-y-3">
                {(client.documents ?? []).map((document) => (
                  <div
                    key={document.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-slate-800">{document.originalName}</p>
                      <p className="text-xs text-slate-400">{formatDate(document.createdAt)}</p>
                    </div>
                    <a
                      href={getDocumentDownloadUrl(document.id)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
                    >
                      Download
                    </a>
                  </div>
                ))}
                {!client.documents?.length ? (
                  <p className="text-sm text-slate-500">Nenhum documento anexado.</p>
                ) : null}
              </div>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Historico de alteracoes</h3>
              <div className="mt-4 space-y-3">
                {(client.changeLogs ?? []).map((log) => (
                  <div key={log.id} className="rounded-2xl border border-slate-100 px-4 py-3">
                    <p className="font-medium text-slate-800">{statusLabel(log.fieldName)}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {log.oldValue ?? '-'} → {log.newValue ?? '-'}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      {log.user.name} em {formatDate(log.createdAt)}
                    </p>
                  </div>
                ))}
                {!client.changeLogs?.length ? (
                  <p className="text-sm text-slate-500">Nenhuma alteracao registrada ainda.</p>
                ) : null}
              </div>
            </article>
          </section>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
          Carregando cliente...
        </div>
      )}
    </div>
  );
}
