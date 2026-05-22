import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormField } from '../components/FormField';
import { PageHeader } from '../components/PageHeader';
import { fetchUsers } from '../services/authService';
import { fetchClients } from '../services/clientService';
import { createProcess, fetchProcess, updateProcess } from '../services/processService';
import type { AuthUser, Client, ProcessPayload } from '../types';

const inputClass =
  'w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400';

type ProcessFeePayload = NonNullable<ProcessPayload['fee']>;
type ProcessInstallmentPayload = ProcessFeePayload['installments'][number];
type ProcessPendingIssuePayload = NonNullable<ProcessPayload['pendingIssues']>[number];

function getInitialState(): ProcessPayload {
  return {
    clientId: '',
    title: '',
    description: '',
    type: 'ABERTURA_EMPRESA',
    status: 'ESCRITORIO_EXECUTANDO',
    priority: 'MEDIA',
    responsibleId: '',
    dueDate: '',
    notes: '',
    flowTemplateId: null,
    fee: {
      totalAmount: 0,
      paymentMethod: 'PIX',
      installmentsCount: 1,
      paymentStatus: 'PENDENTE',
      installments: [
        {
          sequence: 1,
          dueDate: new Date().toISOString().slice(0, 10),
          amount: 0,
          status: 'PENDENTE',
        },
      ],
    },
    pendingIssues: [],
    closureData: {
      closureEffectiveDate: '',
      protocolNumber: '',
      finalNotes: '',
    },
  };
}

export function ProcessFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = useMemo(() => Boolean(id), [id]);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [form, setForm] = useState<ProcessPayload>(getInitialState);
  const [pendingText, setPendingText] = useState('');

  useEffect(() => {
    fetchClients().then(setClients);
    fetchUsers().then(setUsers).catch(() => setUsers([]));
  }, []);

  useEffect(() => {
    if (!id) {
      return;
    }

    fetchProcess(id).then((process) => {
      setForm({
        clientId: process.clientId,
        title: process.title,
        description: process.description ?? '',
        type: process.type,
        status: process.status,
        priority: process.priority,
        responsibleId: process.responsible?.id ?? '',
        dueDate: process.dueDate?.slice(0, 10) ?? '',
        notes: process.notes ?? '',
        flowTemplateId: process.flowTemplateId ?? null,
        fee: process.fee
          ? {
              totalAmount: Number(process.fee.totalAmount),
              paymentMethod: process.fee.paymentMethod as ProcessFeePayload['paymentMethod'],
              installmentsCount: process.fee.installmentsCount,
              paymentStatus: process.fee.paymentStatus as ProcessFeePayload['paymentStatus'],
              installments: process.fee.installments.map((installment) => ({
                sequence: installment.sequence,
                dueDate: installment.dueDate.slice(0, 10),
                amount: Number(installment.amount),
                status: installment.status as ProcessInstallmentPayload['status'],
              })),
            }
          : getInitialState().fee,
        pendingIssues:
          process.pendingIssues?.map((issue) => ({
            type: issue.type as ProcessPendingIssuePayload['type'],
            description: issue.description,
          })) ?? [],
        closureData: {
          closureEffectiveDate: process.closureEffectiveDate?.slice(0, 10) ?? '',
          protocolNumber: process.protocolNumber ?? '',
          finalNotes: process.finalNotes ?? '',
        },
      });
      setPendingText(
        (process.pendingIssues ?? [])
          .map((issue) => `${issue.type}:${issue.description}`)
          .join('\n'),
      );
    });
  }, [id]);

  function rebuildInstallments(totalAmount: number, count: number) {
    const normalizedCount = Math.max(1, count);
    const installmentAmount = totalAmount / normalizedCount;
    const baseDate = form.dueDate || new Date().toISOString().slice(0, 10);

    return Array.from({ length: normalizedCount }).map((_, index) => ({
      sequence: index + 1,
      dueDate: baseDate,
      amount: Number(installmentAmount.toFixed(2)),
      status: 'PENDENTE' as const,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedPending = pendingText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [type, ...descriptionParts] = line.split(':');
        return {
          type: (type || 'OUTRA') as ProcessPendingIssuePayload['type'],
          description: descriptionParts.join(':') || line,
        };
      });

    const payload: ProcessPayload = {
      ...form,
      responsibleId: form.responsibleId || null,
      dueDate: form.dueDate || null,
      fee: form.fee
        ? {
            ...form.fee,
            totalAmount: Number(form.fee.totalAmount),
            installmentsCount: Number(form.fee.installmentsCount),
            installments: form.fee.installments,
          }
        : null,
      pendingIssues: parsedPending,
      closureData: form.closureData,
    };

    if (id) {
      await updateProcess(id, payload);
    } else {
      await createProcess(payload);
    }

    navigate('/processos');
  }

  return (
    <div>
      <PageHeader
        title={isEditing ? 'Editar processo' : 'Novo processo'}
        description="Cadastro de processo com fluxo padrao, pendencias e honorarios pontuais."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Dados principais</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <FormField label="Cliente">
              <select
                className={inputClass}
                value={form.clientId}
                onChange={(event) => setForm((current) => ({ ...current, clientId: event.target.value }))}
              >
                <option value="">Selecione</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.companyName}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Titulo">
              <input
                className={inputClass}
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              />
            </FormField>
            <FormField label="Tipo de processo">
              <select
                className={inputClass}
                value={form.type}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    type: event.target.value as ProcessPayload['type'],
                  }))
                }
              >
                <option value="ABERTURA_EMPRESA">Abertura de Empresa</option>
                <option value="ALTERACAO_EMPRESA">Alteracao de Empresa</option>
                <option value="ENCERRAMENTO_EMPRESA">Encerramento de Empresa</option>
                <option value="FISCAL">Fiscal</option>
                <option value="DP">Departamento Pessoal</option>
                <option value="IMPOSTO_RENDA">Imposto de Renda</option>
                <option value="OUTRO">Outro</option>
              </select>
            </FormField>
            <FormField label="Status">
              <select
                className={inputClass}
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value as ProcessPayload['status'],
                  }))
                }
              >
                <option value="ESCRITORIO_EXECUTANDO">Escritorio Executando</option>
                <option value="PARADO_COM_CLIENTE">Parado com Cliente</option>
                <option value="CONCLUIDO">Concluido</option>
              </select>
            </FormField>
            <FormField label="Prioridade">
              <select
                className={inputClass}
                value={form.priority}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    priority: event.target.value as ProcessPayload['priority'],
                  }))
                }
              >
                <option value="BAIXA">Baixa</option>
                <option value="MEDIA">Media</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </select>
            </FormField>
            <FormField label="Responsavel interno">
              <select
                className={inputClass}
                value={form.responsibleId ?? ''}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    responsibleId: event.target.value,
                  }))
                }
              >
                <option value="">Nao definido</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Prazo final">
              <input
                type="date"
                className={inputClass}
                value={form.dueDate ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
              />
            </FormField>
            <div className="md:col-span-2 xl:col-span-3">
              <FormField label="Descricao / observacoes">
                <textarea
                  className={inputClass}
                  rows={4}
                  value={form.notes ?? ''}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                />
              </FormField>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Honorarios do servico pontual</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FormField label="Valor">
              <input
                type="number"
                step="0.01"
                className={inputClass}
                value={form.fee?.totalAmount ?? 0}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    fee: current.fee
                      ? {
                          ...current.fee,
                          totalAmount: Number(event.target.value),
                          installments: rebuildInstallments(
                            Number(event.target.value),
                            current.fee.installmentsCount,
                          ),
                        }
                      : null,
                  }))
                }
              />
            </FormField>
            <FormField label="Forma de pagamento">
              <select
                className={inputClass}
                value={form.fee?.paymentMethod ?? 'PIX'}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    fee: current.fee
                      ? {
                          ...current.fee,
                          paymentMethod: event.target.value as NonNullable<ProcessPayload['fee']>['paymentMethod'],
                        }
                      : null,
                  }))
                }
              >
                <option value="PIX">PIX</option>
                <option value="BOLETO">Boleto</option>
                <option value="DINHEIRO">Dinheiro</option>
                <option value="CARTAO_CREDITO">Cartao Credito</option>
                <option value="CARTAO_DEBITO">Cartao Debito</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="OUTRO">Outro</option>
              </select>
            </FormField>
            <FormField label="Quantidade de parcelas">
              <input
                type="number"
                min={1}
                className={inputClass}
                value={form.fee?.installmentsCount ?? 1}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    fee: current.fee
                      ? {
                          ...current.fee,
                          installmentsCount: Number(event.target.value),
                          installments: rebuildInstallments(
                            current.fee.totalAmount,
                            Number(event.target.value),
                          ),
                        }
                      : null,
                  }))
                }
              />
            </FormField>
            <FormField label="Status do pagamento">
              <select
                className={inputClass}
                value={form.fee?.paymentStatus ?? 'PENDENTE'}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    fee: current.fee
                      ? {
                          ...current.fee,
                          paymentStatus: event.target.value as NonNullable<ProcessPayload['fee']>['paymentStatus'],
                        }
                      : null,
                  }))
                }
              >
                <option value="PENDENTE">Pendente</option>
                <option value="PARCIAL">Parcial</option>
                <option value="PAGO">Pago</option>
              </select>
            </FormField>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Pendencias e encerramento</h3>
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <FormField label="Pendencias (uma por linha no formato TIPO:Descricao)">
              <textarea
                className={inputClass}
                rows={8}
                value={pendingText}
                onChange={(event) => setPendingText(event.target.value)}
              />
            </FormField>
            <div className="grid gap-4">
              <FormField label="Data efetiva da baixa">
                <input
                  type="date"
                  className={inputClass}
                  value={form.closureData?.closureEffectiveDate ?? ''}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      closureData: { ...current.closureData, closureEffectiveDate: event.target.value },
                    }))
                  }
                />
              </FormField>
              <FormField label="Numero do protocolo">
                <input
                  className={inputClass}
                  value={form.closureData?.protocolNumber ?? ''}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      closureData: { ...current.closureData, protocolNumber: event.target.value },
                    }))
                  }
                />
              </FormField>
              <FormField label="Observacoes finais">
                <textarea
                  className={inputClass}
                  rows={4}
                  value={form.closureData?.finalNotes ?? ''}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      closureData: { ...current.closureData, finalNotes: event.target.value },
                    }))
                  }
                />
              </FormField>
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-2xl bg-sky-500 px-5 py-3 font-semibold text-white transition hover:bg-sky-600"
          >
            {isEditing ? 'Atualizar processo' : 'Cadastrar processo'}
          </button>
        </div>
      </form>
    </div>
  );
}
