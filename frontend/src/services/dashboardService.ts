import { api } from './api';
import type { DashboardSummary } from '../types';

export async function fetchDashboardSummary() {
  const { data } = await api.get<DashboardSummary>('/dashboard/summary');
  return data;
}
