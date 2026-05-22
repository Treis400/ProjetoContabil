import { ChangeEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { getDocumentDownloadUrl } from '../services/documentService';
import { fetchProcess, updateProcessStatus, uploadProcessDocument } from '../services/processService';
import type { Process } from '../types';
import { formatCurrency, formatDate, statusLabel } from '../utils/format';

export function ProcessDetailPage() {
  const { id } = useParams();
  const [process, setProcess] = useState<Process | null>(null);

  async function loadProcess() {
    if (!id) {
      return;
    }

    const data = await fetchProcess(id);
    setProcess(data);
  }

  useEffect(() => {
    loadProcess();
  }, [id]);

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || !id) {
      return;
    }

    await uploadProcessDocument(id, file);
    await loadProcess();
  }

  async function handleStatus(status: Process['status']) {
    if (!id) {
      return;
    }

    await updateProcessStatus(id, status, `Status alterado para ${status}.`);
    await loadProcess();
  }

  return (
    <div>
      <PageHeader
        title={process?.title ?? 'Processo'}
        description="Detalhes operacionais, etapas, honorarios, pendencias e documentos."
        action={
          process ? (
            <Link
              to={`/processos/${process.id}/editar`}
              className="rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
            >
              Editar processo
            </Link>
          ) : null
        }
      />

      {process ? (
        <div className="space-y-6">
          <section className="grid gap-4 xl:grid-cols-3">
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{process.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{process.client.companyName}</p>
                </div>
                <StatusBadge value={process.status} />
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Tipo</p>
                  <p className="mt-2 font-medium text-slate-800">{statusLabel(process.type)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Responsavel</p>
                  <p className="mt-2 font-medium text-slate-800">{process.responsible?.name ?? '-'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Prazo</p>
                  <p className="mt-2 font-medium text-slate-800">{formatDate(process.dueDate)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Prioridade</p>
                  <p className="mt-2 font-medium text-slate-800">{statusLabel(process.priority)}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleStatus('ESCRITORIO_EXECUTANDO')}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Escritorio Executando
                </button>
                <button
                  type="button"
                  onClick={() => handleStatus('PARADO_COM_CLIENTE')}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Parado com Cliente
                </button>
                <button
                  type="button"
                  onClick={() => handleStatus('CONCLUIDO')}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Concluir
                </button>
              </div>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Honorarios</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p>
                  <strong className="text-slate-800">Valor:</strong>{' '}
                  {formatCurrency(process.fee?.totalAmount)}
                </p>
                <p>
                  <strong className="text-slate-800">Pagamento:</strong>{' '}
                  {process.fee?.paymentMethod ? statusLabel(process.fee.paymentMethod) : '-'}
                </p>
                <p>
                  <strong className="text-slate-800">Parcelas:</strong>{' '}
                  {process.fee?.installmentsCount ?? 0}
                </p>
                <p>
                  <strong className="text-slate-800">Status:</strong>{' '}
                  {process.fee?.paymentStatus ? statusLabel(process.fee.paymentStatus) : '-'}
                </p>
              </div>
            </article>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Etapas do fluxo</h3>
              <div className="mt-4 space-y-3">
                {process.steps.map((step) => (
                  <div key={step.id} className="rounded-2xl border border-slate-100 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-800">
                          {step.orderIndex}. {step.title}
                        </p>
                        <p className="text-xs text-slate-400">
                          Prazo: {formatDate(step.dueDate)}
                        </p>
                      </div>
                      <StatusBadge value={step.status} />
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Documentos</h3>
                <label className="cursor-pointer rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
                  Enviar arquivo
                  <input type="file" className="hidden" onChange={handleUpload} />
                </label>
              </div>
              <div className="mt-4 space-y-3">
                {(process.documents ?? []).map((document) => (
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
                {!process.documents?.length ? (
                  <p className="text-sm text-slate-500">Nenhum documento anexado.</p>
                ) : null}
              </div>
            </article>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Pendencias</h3>
              <div className="mt-4 space-y-3">
                {(process.pendingIssues ?? []).map((issue) => (
                  <div key={issue.id} className="rounded-2xl border border-slate-100 px-4 py-3">
                    <p className="font-medium text-slate-800">{statusLabel(issue.type)}</p>
                    <p className="mt-1 text-sm text-slate-500">{issue.description}</p>
                  </div>
                ))}
                {!process.pendingIssues?.length ? (
                  <p className="text-sm text-slate-500">Sem pendencias registradas.</p>
                ) : null}
              </div>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Historico de movimentacoes</h3>
              <div className="mt-4 space-y-3">
                {(process.movements ?? []).map((movement) => (
                  <div key={movement.id} className="rounded-2xl border border-slate-100 px-4 py-3">
                    <p className="font-medium text-slate-800">{movement.description}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {movement.user.name} em {formatDate(movement.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
          Carregando processo...
        </div>
      )}
    </div>
  );
}
