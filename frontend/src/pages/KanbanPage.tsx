import { useEffect, useState } from 'react';
import { KanbanBoard } from '../components/KanbanBoard';
import { PageHeader } from '../components/PageHeader';
import { fetchKanban, updateProcessStatus } from '../services/processService';
import type { Process } from '../types';

export function KanbanPage() {
  const [data, setData] = useState<Record<string, Process[]>>({});

  async function loadKanban() {
    const response = await fetchKanban();
    setData(response);
  }

  useEffect(() => {
    loadKanban();
  }, []);

  async function handleMove(process: Process, nextStatus: Process['status']) {
    await updateProcessStatus(process.id, nextStatus, `Card movido para ${nextStatus}.`);
    await loadKanban();
  }

  return (
    <div>
      <PageHeader
        title="Kanban"
        description="Visualizacao em colunas para acompanhar o andamento operacional dos processos."
      />

      <KanbanBoard data={data} onMove={handleMove} />
    </div>
  );
}
