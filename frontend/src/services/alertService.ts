import { api } from './api';
import type { Alert } from '../types';

export async function fetchAlerts() {
  const { data } = await api.get<Alert[]>('/alerts');
  return data;
}

export async function resolveAlert(id: string) {
  const { data } = await api.patch<Alert>(`/alerts/${id}/resolve`);
  return data;
}
