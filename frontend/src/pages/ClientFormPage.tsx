import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

export function ClientFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = useMemo(() => Boolean(id), [id]);
  const [form, setForm] = useState<ClientPayload>(getInitialState);
  const [loading, setLoading] = useState(false);

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
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      } else {
        await createClient(payload);
      }

      navigate('/clientes');
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

  return (
    <div>
      <PageHeader
        title={isEditing ? 'Editar cliente' : 'Novo cliente'}
        description="Formulario completo com dados empresariais, tributarios, servicos e mensalidade."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Dados da empresa</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <FormField label="Razao Social">
              <input name="companyName" className={inputClass} value={form.companyName} onChange={handleChange} />
            </FormField>
            <FormField label="Nome Fantasia">
              <input name="tradeName" className={inputClass} value={form.tradeName ?? ''} onChange={handleChange} />
            </FormField>
            <FormField label="CNPJ">
              <input name="cnpj" className={inputClass} value={form.cnpj} onChange={handleChange} />
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
            <FormField label="Situacao da Empresa">
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
            <FormField label="Tipo de Empresa">
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
            <FormField label="Situacao Tributaria">
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
            <FormField label="Valor da mensalidade">
              <input
                type="number"
                step="0.01"
                className={inputClass}
                value={form.monthlyFee.amount}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    monthlyFee: { ...current.monthlyFee, amount: Number(event.target.value) },
                  }))
                }
              />
            </FormField>
            <FormField label="Inicio do contrato">
              <input
                type="date"
                className={inputClass}
                value={form.monthlyFee.startDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    monthlyFee: { ...current.monthlyFee, startDate: event.target.value },
                  }))
                }
              />
            </FormField>
            <FormField label="Status do contrato">
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
