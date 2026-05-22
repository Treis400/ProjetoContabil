import { useEffect, useState } from 'react';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';
import { getDocumentDownloadUrl } from '../services/documentService';
import { fetchDocuments } from '../services/documentService';
import type { DocumentItem } from '../types';
import { formatDate, statusLabel } from '../utils/format';

export function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  useEffect(() => {
    fetchDocuments().then(setDocuments);
  }, []);

  return (
    <div>
      <PageHeader
        title="Documentos"
        description="Central de anexos vinculados a clientes e processos."
      />

      <DataTable headers={['Arquivo', 'Tipo', 'Cliente', 'Processo', 'Enviado em', 'Acoes']}>
        {documents.map((document) => (
          <tr key={document.id} className="text-sm text-slate-600">
            <td className="px-4 py-4 font-medium text-slate-900">{document.originalName}</td>
            <td className="px-4 py-4">{statusLabel(document.entityType)}</td>
            <td className="px-4 py-4">{document.client?.companyName ?? '-'}</td>
            <td className="px-4 py-4">{document.process?.title ?? '-'}</td>
            <td className="px-4 py-4">{formatDate(document.createdAt)}</td>
            <td className="px-4 py-4">
              <a
                href={getDocumentDownloadUrl(document.id)}
                className="rounded-xl border border-slate-200 px-3 py-2 font-medium text-slate-700"
              >
                Download
              </a>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
