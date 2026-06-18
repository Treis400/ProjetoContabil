import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Upload, FileText, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { importFiscalDocumentXml } from '../../services/fiscalService';
import type { FiscalDocument, FiscalEntryExit, ValidationError } from '../../types';

type FileEntry = {
  name: string;
  content: string;
  status: 'pendente' | 'processando' | 'ok' | 'erro';
  result?: FiscalDocument;
  error?: string;
};

export function FiscalDocumentImportPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('clientId') ?? '';

  const [files, setFiles] = useState<FileEntry[]>([]);
  const [entryExit, setEntryExit] = useState<FiscalEntryExit>('ENTRADA');
  const [importing, setImporting] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    const readers = selected.map(
      (file) =>
        new Promise<FileEntry>((resolve) => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve({ name: file.name, content: reader.result as string, status: 'pendente' });
          reader.readAsText(file, 'UTF-8');
        }),
    );
    Promise.all(readers).then((entries) => setFiles((prev) => [...prev, ...entries]));
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files).filter((f) => f.name.endsWith('.xml'));
    const readers = dropped.map(
      (file) =>
        new Promise<FileEntry>((resolve) => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve({ name: file.name, content: reader.result as string, status: 'pendente' });
          reader.readAsText(file, 'UTF-8');
        }),
    );
    Promise.all(readers).then((entries) => setFiles((prev) => [...prev, ...entries]));
  }

  async function handleImport() {
    if (!clientId || files.length === 0) return;
    setImporting(true);

    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== 'pendente') continue;

      setFiles((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, status: 'processando' } : f)),
      );

      try {
        const result = await importFiscalDocumentXml({
          clientId,
          entryExit,
          xmlContent: files[i].content,
        });
        setFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: 'ok', result } : f)),
        );
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Erro ao importar';
        setFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: 'erro', error: msg } : f)),
        );
      }
    }

    setImporting(false);
  }

  const pending = files.filter((f) => f.status === 'pendente').length;
  const done = files.filter((f) => f.status === 'ok').length;
  const errors = files.filter((f) => f.status === 'erro').length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Importar XML"
        description="Importe NF-e e CT-e em lote a partir dos arquivos XML"
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-slate-700">Tipo de operação:</label>
          <div className="flex gap-3">
            {(['ENTRADA', 'SAIDA'] as FiscalEntryExit[]).map((v) => (
              <label key={v} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="entryExit"
                  value={v}
                  checked={entryExit === v}
                  onChange={() => setEntryExit(v)}
                  className="text-sky-600"
                />
                {v === 'ENTRADA' ? 'Entrada' : 'Saída'}
              </label>
            ))}
          </div>
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center hover:border-sky-400 hover:bg-sky-50 transition"
        >
          <Upload size={28} className="text-slate-400" />
          <p className="text-sm text-slate-600">Arraste arquivos XML aqui ou</p>
          <label className="cursor-pointer rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">
            Selecionar arquivos
            <input
              type="file"
              accept=".xml"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
          <p className="text-xs text-slate-400">Suporta NF-e e CT-e • múltiplos arquivos</p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-700">
              {files.length} arquivo(s) — {done} importado(s), {errors} com erro
            </p>
            <div className="flex items-center gap-2">
              {pending > 0 && !importing && (
                <button
                  onClick={handleImport}
                  disabled={!clientId}
                  className="rounded-xl bg-sky-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  Importar {pending} arquivo(s)
                </button>
              )}
              {importing && (
                <span className="text-sm text-slate-500 animate-pulse">Importando...</span>
              )}
            </div>
          </div>

          <ul className="divide-y divide-slate-100">
            {files.map((file, i) => (
              <li key={i} className="flex items-start gap-3 px-4 py-3">
                <div className="mt-0.5">
                  {file.status === 'pendente' && <FileText size={16} className="text-slate-400" />}
                  {file.status === 'processando' && <FileText size={16} className="text-sky-400 animate-pulse" />}
                  {file.status === 'ok' && <CheckCircle size={16} className="text-emerald-500" />}
                  {file.status === 'erro' && <AlertTriangle size={16} className="text-rose-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-slate-700">{file.name}</p>
                  {file.status === 'ok' && file.result && (
                    <p className="text-xs text-emerald-600">
                      {file.result.documentType} {file.result.series}/{file.result.documentNumber} — {file.result.nameIssuer}
                      {file.result.validationStatus !== 'VALIDO' && (
                        <span className="ml-2 text-amber-600">⚠ {file.result.validationErrors?.length} aviso(s)</span>
                      )}
                    </p>
                  )}
                  {file.status === 'erro' && (
                    <p className="text-xs text-rose-600">{file.error}</p>
                  )}
                </div>
                <button
                  onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  className="text-slate-300 hover:text-slate-500"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!clientId && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
          ⚠ Nenhum cliente selecionado. Volte para a listagem e selecione um cliente antes de importar.
        </p>
      )}

      <div className="flex justify-between">
        <button
          onClick={() => navigate(`/fiscal/documentos?clientId=${clientId}`)}
          className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          ← Voltar para escrituração
        </button>
        {done > 0 && (
          <button
            onClick={() => navigate(`/fiscal/documentos?clientId=${clientId}`)}
            className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Ver documentos importados →
          </button>
        )}
      </div>
    </div>
  );
}
