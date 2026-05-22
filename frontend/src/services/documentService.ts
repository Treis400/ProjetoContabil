import { api } from './api';
import type { DocumentItem } from '../types';

export async function fetchDocuments(params?: Record<string, string>) {
  const { data } = await api.get<DocumentItem[]>('/documents', { params });
  return data;
}

export function getDocumentDownloadUrl(id: string) {
  return `${api.defaults.baseURL}/documents/${id}/download`;
}
