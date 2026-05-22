import { api } from './api';
import type { TaxReview } from '../types';

export async function fetchTaxReviews() {
  const { data } = await api.get<TaxReview[]>('/tax-reviews');
  return data;
}

export async function createTaxReview(payload: {
  clientId: string;
  year: number;
  status: string;
  verificationDate: string;
  notes?: string;
}) {
  const { data } = await api.post<TaxReview>('/tax-reviews', payload);
  return data;
}

export async function updateTaxReview(
  id: string,
  payload: {
    clientId: string;
    year: number;
    status: string;
    verificationDate: string;
    notes?: string;
  },
) {
  const { data } = await api.put<TaxReview>(`/tax-reviews/${id}`, payload);
  return data;
}
