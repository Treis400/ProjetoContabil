import { isAxiosError } from 'axios';
import { CheckCircle2, X } from 'lucide-react';
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { FormField } from '../components/FormField';
import { PageHeader } from '../components/PageHeader';
import { createClient, fetchClient, updateClient } from '../services/clientService';
import type { ClientPayload } from '../types';

const serviceOptions = [
  'CONTABILIDADE_REGULAR',
  'MEI',
  'FOLHA_DOMESTICA',
  'ASSESSORIA',
  'DEPARTAMENTO_PESSOAL',
  'FISCAL',
  'IMPOSTO_RENDA',
  'ABERTURA_EMPRESA',
  'ALTERACAO_CONTRATUAL',
  'ENCERRAMENTO_EMPRESA',
  'OUTROS',
];

const inputClass =
  'w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400';

type ClientRequiredField =
  | 'companyName'
  | 'cnpj'
  | 'monthlyFee.startDate';

function getInitialState(): ClientPayload {
  return {
    companyName: '',
    tradeName: '',
    cnpj: '',
    stateRegistration: '',
    municipalRegistration: '',
    mainCnae: '',
    taxRegime: '',
    openingDate: '',
    companyStatus: 'ATIVA',
    legalRepresentative: '',
    legalRepresentativeCpf: '',
    phone: '',
    whatsapp: '',
    email: '',
    fullAddress: '',
    internalNotes: '',
    taxProfile: {
      companyType: 'SIMPLES_NACIONAL',
      cityHall: '',
      regulatoryAgency: '',
      digitalCertificate: '',
      digitalCertificateExpiry: '',
      currentTaxSituation: 'SIMPLES_NACIONAL_ATIVO',
    },
    services: [{ serviceType: 'CONTABILIDADE_REGULAR', description: '' }],
    monthlyFee: {
      amount: 0,
      startDate: new Date().toISOString().slice(0, 10),
      status: 'ATIVO',
    },
  };
}

function formatCurrencyInput(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function parseCurrencyInput(value: string) {
  const digitsOnly = value.replace(/\D/g, '');

  if (!digitsOnly) {
    return {
      amount: 0,
      displayValue: '',
    };
  }

  const amount = Number(digitsOnly) / 100;

  return {
    amount,
    displayValue: formatCurrencyInput(amount),
  };
}

export function ClientFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEditing = useMemo(() => Boolean(id), [id]);
  const [form, setForm] = useState<ClientPayload>(getInitialState);
  const [monthlyFeeAmountInput, setMonthlyFeeAmountInput] = useState(() =>
    formatCurrencyInput(getInitialState().monthlyFee.amount),
  );
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [requiredFieldErrors, setRequiredFieldErrors] = useState<
    Partial<Record<ClientRequiredField, boolean>>
  >({});
  const [showSuccessAlert, setShowSuccessAlert] = useState(
    Boolean((location.state as { showClientCreatedAlert?: boolean } | null)?.showClientCreatedAlert),
  );

  useEffect(() => {
    const shouldShowAlert = Boolean(
      (location.state as { showClientCreatedAlert?: boolean } | null)?.showClientCreatedAlert,
    );

    setShowSuccessAlert(shouldShowAlert);
  }, [location.state]);

  useEffect(() => {
    if (!id) {
      return;
    }

    fetchClient(id).then((client) => {
      setForm({
        companyName: client.companyName,
        tradeName: client.tradeName ?? '',
        cnpj: client.cnpj,
        stateRegistration: client.stateRegistration ?? '',
        municipalRegistration: client.municipalRegistration ?? '',
        mainCnae: client.mainCnae ?? '',
        taxRegime: client.taxRegime ?? '',
        openingDate: client.openingDate?.slice(0, 10) ?? '',
        companyStatus: client.companyStatus,
        legalRepresentative: client.legalRepresentative ?? '',
        legalRepresentativeCpf: client.legalRepresentativeCpf ?? '',
        phone: client.phone ?? '',
        whatsapp: client.whatsapp ?? '',
        email: client.email ?? '',
        fullAddress: client.fullAddress ?? '',
        internalNotes: client.internalNotes ?? '',
        taxProfile: {
          companyType: client.taxProfile.companyType,
          cityHall: client.taxProfile.cityHall ?? '',
          regulatoryAgency: client.taxProfile.regulatoryAgency ?? '',
          digitalCertificate: client.taxProfile.digitalCertificate ?? '',
          digitalCertificateExpiry: client.taxProfile.digitalCertificateExpiry?.slice(0, 10) ?? '',
          currentTaxSituation: client.taxProfile.currentTaxSituation ?? 'SIMPLES_NACIONAL_ATIVO',
        },
        services: client.services.length
          ? client.services.map((service) => ({
              serviceType: service.serviceType,
              description: service.description ?? '',
            }))
          : [],
        monthlyFee: {
          amount: Number(client.monthlyFees?.find((item) => item.isCurrent)?.amount ?? 0),
          startDate:
            client.monthlyFees?.find((item) => item.isCurrent)?.startDate.slice(0, 10) ??
            new Date().toISOString().slice(0, 10),
          status:
            (client.monthlyFees?.find((item) => item.isCurrent)?.status as
              | 'ATIVO'
              | 'SUSPENSO'
              | 'ENCERRADO') ?? 'ATIVO',
        },
      });
      setMonthlyFeeAmountInput(
        formatCurrencyInput(Number(client.monthlyFees?.find((item) => item.isCurrent)?.amount ?? 0)),
      );
    });
  }, [id]);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
    clearRequiredFieldError(name as ClientRequiredField);
  }

  function clearRequiredFieldError(field: ClientRequiredField) {
    setRequiredFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      return {
        ...current,
        [field]: false,
      };
    });
  }

  function validateRequiredFields() {
    const nextErrors: Partial<Record<ClientRequiredField, boolean>> = {
      companyName: !form.companyName.trim(),
      cnpj: !form.cnpj.trim(),
      'monthlyFee.startDate': !form.monthlyFee.startDate.trim(),
    };

    setRequiredFieldErrors(nextErrors);

    return !Object.values(nextErrors).some(Boolean);
  }

  function getInputClassName(field: ClientRequiredField) {
    if (!requiredFieldErrors[field]) {
      return inputClass;
    }

    return `${inputClass} !border-2 !border-rose-500 pr-4 text-rose-600 placeholder:text-rose-500 placeholder:italic focus:!border-rose-600 focus:ring-1 focus:ring-rose-200`;
  }

  function getRequiredPlaceholder(field: ClientRequiredField, fallback = '') {
    return requiredFieldErrors[field] ? 'Campo obrigatorio' : fallback;
  }

  function handleMonthlyFeeStartDateChange(value: string) {
    setForm((current) => ({
      ...current,
      monthlyFee: { ...current.monthlyFee, startDate: value },
    }));
    clearRequiredFieldError('monthlyFee.startDate');
  }

  function handleMonthlyFeeAmountChange(value: string) {
    const { amount, displayValue } = parseCurrencyInput(value);

    setMonthlyFeeAmountInput(displayValue);
    setForm((current) => ({
      ...current,
      monthlyFee: { ...current.monthlyFee, amount },
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError('');

    if (!validateRequiredFields()) {
      return;
    }

    setLoading(true);

    const payload = {
      ...form,
      email: form.email || null,
      openingDate: form.openingDate || null,
      services: form.services.length ? form.services : [{ serviceType: 'OUTROS', description: '' }],
      monthlyFee: {
        ...form.monthlyFee,
        amount: Number(form.monthlyFee.amount),
      },
    };

    try {
      if (id) {
        await updateClient(id, payload);
        navigate('/clientes', {
          state: { successMessage: 'Cliente atualizado com sucesso' },
        });
      } else {
        const createdClient = await createClient(payload);
        navigate(`/clientes/${createdClient.id}/editar`, {
          state: { showClientCreatedAlert: true },
        });
      }
    } catch (error) {
      if (isAxiosError<{ message?: string }>(error)) {
        setSubmitError(
          error.response?.data?.message ??
            'Nao foi possivel salvar o cliente. Verifique se o backend esta rodando e tente novamente.',
        );
      } else {
        setSubmitError('Nao foi possivel salvar o cliente. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  function toggleService(serviceType: string) {
    setForm((current) => {
      const exists = current.services.some((item) => item.serviceType === serviceType);
      return {
        ...current,
        services: exists
          ? current.services.filter((item) => item.serviceType !== serviceType)
          : [...current.services, { serviceType, description: '' }],
      };
    });
  }

  function closeSuccessAlert() {
    setShowSuccessAlert(false);
    navigate(location.pathname, { replace: true, state: null });
  }

  function handleCreateAnotherClient() {
    setShowSuccessAlert(false);
    navigate('/clientes/novo');
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function handleBackToList() {
    setShowSuccessAlert(false);
    navigate('/clientes');
  }

  return (
    <div>
      <PageHeader
        title={isEditing ? 'Editar cliente' : 'Novo cliente'}
        description="Formulario completo com dados empresariais, tributarios, servicos e mensalidade."
      />

      {showSuccessAlert ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[2rem] border border-sky-200 bg-white p-6 shadow-2xl shadow-sky-200/40">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <span className="mt-0.5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
                  <CheckCircle2 size={22} />
                </span>
                <div>
                  <h3 className="text-xl font-semibold text-sky-950">Cliente cadastrado com sucesso</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Escolha o proximo passo para continuar o fluxo de cadastro.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleCreateAnotherClient}
                      className="rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
                    >
                      Fazer um novo cadastro
                    </button>
                    <button
                      type="button"
                      onClick={handleBackToList}
                      className="rounded-2xl border border-sky-200 bg-white px-5 py-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
                    >
                      Voltar para a lista
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={closeSuccessAlert}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-sky-100 hover:text-sky-700"
                aria-label="Fechar alerta de sucesso"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {submitError ? (
        <div className="mb-6 rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 shadow-sm">
          {submitError}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Dados da empresa</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <FormField
              label="Razao Social"
              required
              tooltip="Campo obrigatorio para identificar juridicamente a empresa."
              description="Informe o nome registrado no contrato social e no CNPJ."
            >
              <input
                name="companyName"
                className={getInputClassName('companyName')}
                value={form.companyName}
                onChange={handleChange}
                placeholder={getRequiredPlaceholder('companyName')}
              />
            </FormField>
            <FormField label="Nome Fantasia">
              <input name="tradeName" className={inputClass} value={form.tradeName ?? ''} onChange={handleChange} />
            </FormField>
            <FormField
              label="CNPJ"
              required
              tooltip="Campo obrigatorio para localizar a empresa nos cadastros fiscais."
              description="Digite o CNPJ completo da empresa com 14 digitos."
            >
              <input
                name="cnpj"
                className={getInputClassName('cnpj')}
                value={form.cnpj}
                onChange={handleChange}
                placeholder={getRequiredPlaceholder('cnpj')}
              />
            </FormField>
            <FormField label="Inscricao Estadual">
              <input name="stateRegistration" className={inputClass} value={form.stateRegistration ?? ''} onChange={handleChange} />
            </FormField>
            <FormField label="Inscricao Municipal">
              <input name="municipalRegistration" className={inputClass} value={form.municipalRegistration ?? ''} onChange={handleChange} />
            </FormField>
            <FormField label="CNAE Principal">
              <input name="mainCnae" className={inputClass} value={form.mainCnae ?? ''} onChange={handleChange} />
            </FormField>
            <FormField label="Regime Tributario">
              <input name="taxRegime" className={inputClass} value={form.taxRegime ?? ''} onChange={handleChange} />
            </FormField>
            <FormField label="Data de Abertura">
              <input type="date" name="openingDate" className={inputClass} value={form.openingDate ?? ''} onChange={handleChange} />
            </FormField>
            <FormField
              label="Situacao da Empresa"
              required
              tooltip="Campo obrigatorio para indicar o estado atual da empresa no sistema."
              description="Selecione se a empresa esta ativa, suspensa, inativa ou encerrada."
            >
              <select name="companyStatus" className={inputClass} value={form.companyStatus} onChange={handleChange}>
                <option value="ATIVA">Ativa</option>
                <option value="SUSPENSA">Suspensa</option>
                <option value="INATIVA">Inativa</option>
                <option value="ENCERRADA">Encerrada</option>
              </select>
            </FormField>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Contato e responsavel</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <FormField label="Responsavel Legal">
              <input name="legalRepresentative" className={inputClass} value={form.legalRepresentative ?? ''} onChange={handleChange} />
            </FormField>
            <FormField label="CPF do Responsavel">
              <input name="legalRepresentativeCpf" className={inputClass} value={form.legalRepresentativeCpf ?? ''} onChange={handleChange} />
            </FormField>
            <FormField label="Telefone">
              <input name="phone" className={inputClass} value={form.phone ?? ''} onChange={handleChange} />
            </FormField>
            <FormField label="WhatsApp">
              <input name="whatsapp" className={inputClass} value={form.whatsapp ?? ''} onChange={handleChange} />
            </FormField>
            <FormField label="E-mail">
              <input name="email" className={inputClass} value={form.email ?? ''} onChange={handleChange} />
            </FormField>
            <FormField label="Endereco Completo">
              <textarea name="fullAddress" className={inputClass} rows={3} value={form.fullAddress ?? ''} onChange={handleChange} />
            </FormField>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Dados tributarios</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <FormField
              label="Tipo de Empresa"
              required
              tooltip="Campo obrigatorio para classificar o enquadramento principal da empresa."
              description="Escolha o porte ou regime estrutural mais aderente ao cliente."
            >
              <select
                className={inputClass}
                value={form.taxProfile.companyType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    taxProfile: { ...current.taxProfile, companyType: event.target.value as ClientPayload['taxProfile']['companyType'] },
                  }))
                }
              >
                <option value="MEI">MEI</option>
                <option value="SIMPLES_NACIONAL">Simples Nacional</option>
                <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
                <option value="LUCRO_REAL">Lucro Real</option>
              </select>
            </FormField>
            <FormField label="Prefeitura vinculada">
              <input
                className={inputClass}
                value={form.taxProfile.cityHall ?? ''}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    taxProfile: { ...current.taxProfile, cityHall: event.target.value },
                  }))
                }
              />
            </FormField>
            <FormField label="Orgao Regulador">
              <input
                className={inputClass}
                value={form.taxProfile.regulatoryAgency ?? ''}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    taxProfile: { ...current.taxProfile, regulatoryAgency: event.target.value },
                  }))
                }
              />
            </FormField>
            <FormField label="Certificado Digital">
              <input
                className={inputClass}
                value={form.taxProfile.digitalCertificate ?? ''}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    taxProfile: { ...current.taxProfile, digitalCertificate: event.target.value },
                  }))
                }
              />
            </FormField>
            <FormField label="Vencimento do Certificado">
              <input
                type="date"
                className={inputClass}
                value={form.taxProfile.digitalCertificateExpiry ?? ''}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    taxProfile: { ...current.taxProfile, digitalCertificateExpiry: event.target.value },
                  }))
                }
              />
            </FormField>
            <FormField
              label="Situacao Tributaria"
              tooltip="Ajuda a registrar o enquadramento tributario atual da empresa."
              description="Use este campo para informar como a empresa esta enquadrada hoje."
            >
              <select
                className={inputClass}
                value={form.taxProfile.currentTaxSituation ?? 'SIMPLES_NACIONAL_ATIVO'}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    taxProfile: {
                      ...current.taxProfile,
                      currentTaxSituation: event.target.value as NonNullable<ClientPayload['taxProfile']['currentTaxSituation']>,
                    },
                  }))
                }
              >
                <option value="SIMPLES_NACIONAL_ATIVO">Simples Nacional Ativo</option>
                <option value="SIMPLES_NACIONAL_EXCLUIDO">Simples Nacional Excluido</option>
                <option value="MEI_ATIVO">MEI Ativo</option>
                <option value="MEI_DESENQUADRADO">MEI Desenquadrado</option>
                <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
                <option value="LUCRO_REAL">Lucro Real</option>
              </select>
            </FormField>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Servicos contratados</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {serviceOptions.map((service) => {
              const checked = form.services.some((item) => item.serviceType === service);

              return (
                <label
                  key={service}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700"
                >
                  <input type="checkbox" checked={checked} onChange={() => toggleService(service)} />
                  {service.replaceAll('_', ' ')}
                </label>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Mensalidade e observacoes</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <FormField
              label="Valor da mensalidade"
              required
              tooltip="Campo obrigatorio para registrar o valor corrente do contrato mensal."
              description="Informe o valor mensal atualmente cobrado do cliente."
            >
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-medium text-slate-500">
                  R$
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  className={`${inputClass} pl-12`}
                  value={monthlyFeeAmountInput}
                  onChange={(event) => handleMonthlyFeeAmountChange(event.target.value)}
                  placeholder="0,00"
                />
              </div>
            </FormField>
            <FormField
              label="Inicio do contrato"
              required
              tooltip="Campo obrigatorio para definir quando a mensalidade passou a valer."
              description="Selecione a data inicial de vigencia do contrato mensal."
            >
              <div className="relative">
                <input
                  type="date"
                  className={getInputClassName('monthlyFee.startDate')}
                  value={form.monthlyFee.startDate}
                  onChange={(event) => handleMonthlyFeeStartDateChange(event.target.value)}
                />
                {requiredFieldErrors['monthlyFee.startDate'] && !form.monthlyFee.startDate ? (
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm italic text-rose-500">
                    Campo obrigatorio
                  </span>
                ) : null}
              </div>
            </FormField>
            <FormField
              label="Status do contrato"
              required
              tooltip="Campo obrigatorio para indicar a situacao atual da mensalidade."
              description="Escolha se o contrato esta ativo, suspenso ou encerrado."
            >
              <select
                className={inputClass}
                value={form.monthlyFee.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    monthlyFee: {
                      ...current.monthlyFee,
                      status: event.target.value as ClientPayload['monthlyFee']['status'],
                    },
                  }))
                }
              >
                <option value="ATIVO">Ativo</option>
                <option value="SUSPENSO">Suspenso</option>
                <option value="ENCERRADO">Encerrado</option>
              </select>
            </FormField>
            <div className="md:col-span-2 xl:col-span-3">
              <FormField label="Observacoes internas">
                <textarea name="internalNotes" className={inputClass} rows={4} value={form.internalNotes ?? ''} onChange={handleChange} />
              </FormField>
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-sky-500 px-5 py-3 font-semibold text-white transition hover:bg-sky-600 disabled:opacity-70"
          >
            {loading ? 'Salvando...' : isEditing ? 'Atualizar cliente' : 'Cadastrar cliente'}
          </button>
        </div>
      </form>
    </div>
  );
}
