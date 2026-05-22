import { FormEvent, useEffect, useState } from 'react';
import { DataTable } from '../components/DataTable';
import { FormField } from '../components/FormField';
import { PageHeader } from '../components/PageHeader';
import { fetchClients } from '../services/clientService';
import { createTaxReview, fetchTaxReviews } from '../services/taxReviewService';
import type { Client, TaxReview } from '../types';
import { formatDate, statusLabel } from '../utils/format';

export function TaxReviewsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [reviews, setReviews] = useState<TaxReview[]>([]);
  const [form, setForm] = useState({
    clientId: '',
    year: new Date().getFullYear(),
    status: 'SIMPLES_NACIONAL_ATIVO',
    verificationDate: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  async function loadReviews() {
    const data = await fetchTaxReviews();
    setReviews(data);
  }

  useEffect(() => {
    fetchClients().then(setClients);
    loadReviews();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await createTaxReview({
      ...form,
      year: Number(form.year),
    });
    setForm((current) => ({ ...current, notes: '' }));
    await loadReviews();
  }

  return (
    <div>
      <PageHeader
        title="Controle Tributario Anual"
        description="Revisoes anuais de enquadramento e alertas tributarios da carteira."
      />

      <form onSubmit={handleSubmit} className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <FormField label="Cliente">
            <select
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400"
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
          <FormField label="Ano">
            <input
              type="number"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400"
              value={form.year}
              onChange={(event) => setForm((current) => ({ ...current, year: Number(event.target.value) }))}
            />
          </FormField>
          <FormField label="Situacao">
            <select
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400"
              value={form.status}
              onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
            >
              <option value="SIMPLES_NACIONAL_ATIVO">Simples Nacional Ativo</option>
              <option value="SIMPLES_NACIONAL_EXCLUIDO">Simples Nacional Excluido</option>
              <option value="MEI_ATIVO">MEI Ativo</option>
              <option value="MEI_DESENQUADRADO">MEI Desenquadrado</option>
              <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
              <option value="LUCRO_REAL">Lucro Real</option>
            </select>
          </FormField>
          <FormField label="Data da verificacao">
            <input
              type="date"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400"
              value={form.verificationDate}
              onChange={(event) =>
                setForm((current) => ({ ...current, verificationDate: event.target.value }))
              }
            />
          </FormField>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-2xl bg-sky-500 px-4 py-3 font-semibold text-white transition hover:bg-sky-600"
            >
              Registrar revisao
            </button>
          </div>
        </div>
      </form>

      <DataTable headers={['Cliente', 'Ano', 'Situacao', 'Data', 'Responsavel']}>
        {reviews.map((review) => (
          <tr key={review.id} className="text-sm text-slate-600">
            <td className="px-4 py-4 font-medium text-slate-900">{review.client.companyName}</td>
            <td className="px-4 py-4">{review.year}</td>
            <td className="px-4 py-4">{statusLabel(review.status)}</td>
            <td className="px-4 py-4">{formatDate(review.verificationDate)}</td>
            <td className="px-4 py-4">{review.reviewedBy.name}</td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
