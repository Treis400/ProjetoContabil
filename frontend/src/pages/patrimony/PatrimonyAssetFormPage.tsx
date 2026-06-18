import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import * as svc from '../../services/patrimonyService';
import * as clientSvc from '../../services/clientService';

const lbl = 'block text-xs font-medium text-slate-500 mb-1';

export function PatrimonyAssetFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [clients, setClients] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [responsibles, setResponsibles] = useState<any[]>([]);

  const [form, setForm] = useState({
    clientId: searchParams.get('clientId') ?? '',
    tombamento: '', internalCode: '', description: '',
    serialNumber: '', brand: '', model: '', manufacturer: '',
    groupId: '', locationId: '', responsibleId: '',
    acquisitionType: 'COMPRA', acquisitionDate: '', acquisitionValue: '0',
    residualValue: '0', usefulLifeMonths: '60', usefulLifeMonthsFiscal: '60',
    deprecMethod: 'LINEAR', documentOrigin: '',
    assetAccountCode: '', accumDeprecAccountCode: '', deprecExpenseAccountCode: '',
    technicalNotes: '',
  });

  useEffect(() => { clientSvc.fetchClients().then(setClients); }, []);

  useEffect(() => {
    if (!form.clientId) return;
    Promise.all([svc.listGroups(form.clientId), svc.listLocations(form.clientId), svc.listResponsibles(form.clientId)])
      .then(([g, l, r]) => { setGroups(g); setLocations(l); setResponsibles(r); });
  }, [form.clientId]);

  useEffect(() => {
    if (!id) return;
    svc.getAsset(id).then(data => setForm({
      clientId: data.clientId, tombamento: data.tombamento ?? '', internalCode: data.internalCode ?? '',
      description: data.description ?? '', serialNumber: data.serialNumber ?? '', brand: data.brand ?? '',
      model: data.model ?? '', manufacturer: data.manufacturer ?? '',
      groupId: data.groupId ?? '', locationId: data.locationId ?? '', responsibleId: data.responsibleId ?? '',
      acquisitionType: data.acquisitionType ?? 'COMPRA',
      acquisitionDate: data.acquisitionDate ? data.acquisitionDate.substring(0, 10) : '',
      acquisitionValue: String(data.acquisitionValue ?? '0'), residualValue: String(data.residualValue ?? '0'),
      usefulLifeMonths: String(data.usefulLifeMonths ?? '60'), usefulLifeMonthsFiscal: String(data.usefulLifeMonthsFiscal ?? '60'),
      deprecMethod: data.deprecMethod ?? 'LINEAR', documentOrigin: data.documentOrigin ?? '',
      assetAccountCode: data.assetAccountCode ?? '', accumDeprecAccountCode: data.accumDeprecAccountCode ?? '',
      deprecExpenseAccountCode: data.deprecExpenseAccountCode ?? '', technicalNotes: data.technicalNotes ?? '',
    }));
  }, [id]);

  const f = (k: string) => (e: any) => setForm(p => ({ ...p, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      acquisitionValue: Number(form.acquisitionValue), residualValue: Number(form.residualValue),
      usefulLifeMonths: Number(form.usefulLifeMonths), usefulLifeMonthsFiscal: Number(form.usefulLifeMonthsFiscal),
      groupId: form.groupId || undefined, locationId: form.locationId || undefined, responsibleId: form.responsibleId || undefined,
    };
    if (isEdit) await svc.updateAsset(id, form.clientId, payload);
    else await svc.createAsset(form.clientId, payload);
    navigate('/patrimonio/bens');
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-3">{title}</h3>
      {children}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title={isEdit ? 'Editar Bem Patrimonial' : 'Novo Bem Patrimonial'} description="" />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Section title="Identificação">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className={lbl}>Empresa *</label>
              <select className="input" value={form.clientId} onChange={f('clientId')} required>
                <option value="">Selecione...</option>
                {clients.map((c: any) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
              </select></div>
            <div><label className={lbl}>Tombamento *</label><input className="input" value={form.tombamento} onChange={f('tombamento')} required /></div>
            <div><label className={lbl}>Código Interno</label><input className="input" value={form.internalCode} onChange={f('internalCode')} /></div>
          </div>
          <div><label className={lbl}>Descrição *</label><input className="input" value={form.description} onChange={f('description')} required /></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><label className={lbl}>Nº de Série</label><input className="input" value={form.serialNumber} onChange={f('serialNumber')} /></div>
            <div><label className={lbl}>Marca</label><input className="input" value={form.brand} onChange={f('brand')} /></div>
            <div><label className={lbl}>Modelo</label><input className="input" value={form.model} onChange={f('model')} /></div>
            <div><label className={lbl}>Fabricante</label><input className="input" value={form.manufacturer} onChange={f('manufacturer')} /></div>
          </div>
        </Section>

        <Section title="Classificação">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className={lbl}>Grupo</label>
              <select className="input" value={form.groupId} onChange={f('groupId')}>
                <option value="">Nenhum</option>
                {groups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select></div>
            <div><label className={lbl}>Localização</label>
              <select className="input" value={form.locationId} onChange={f('locationId')}>
                <option value="">Nenhuma</option>
                {locations.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select></div>
            <div><label className={lbl}>Responsável</label>
              <select className="input" value={form.responsibleId} onChange={f('responsibleId')}>
                <option value="">Nenhum</option>
                {responsibles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select></div>
          </div>
        </Section>

        <Section title="Dados de Aquisição e Depreciação">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className={lbl}>Tipo de Aquisição</label>
              <select className="input" value={form.acquisitionType} onChange={f('acquisitionType')}>
                <option value="COMPRA">Compra</option>
                <option value="DOACAO">Doação</option>
                <option value="TRANSFERENCIA">Transferência</option>
                <option value="CONSTRUCAO_PROPRIA">Construção Própria</option>
              </select></div>
            <div><label className={lbl}>Data de Aquisição *</label><input className="input" type="date" value={form.acquisitionDate} onChange={f('acquisitionDate')} required /></div>
            <div><label className={lbl}>Valor de Aquisição (R$) *</label><input className="input" type="number" step="0.01" value={form.acquisitionValue} onChange={f('acquisitionValue')} required /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div><label className={lbl}>Valor Residual (R$)</label><input className="input" type="number" step="0.01" value={form.residualValue} onChange={f('residualValue')} /></div>
            <div><label className={lbl}>Vida Útil Contábil (meses)</label><input className="input" type="number" value={form.usefulLifeMonths} onChange={f('usefulLifeMonths')} /></div>
            <div><label className={lbl}>Vida Útil Fiscal (meses)</label><input className="input" type="number" value={form.usefulLifeMonthsFiscal} onChange={f('usefulLifeMonthsFiscal')} /></div>
            <div><label className={lbl}>Método de Depreciação</label>
              <select className="input" value={form.deprecMethod} onChange={f('deprecMethod')}>
                <option value="LINEAR">Linear</option>
                <option value="SOMA_DIGITOS">Soma dos Dígitos</option>
                <option value="UNIDADES_PRODUZIDAS">Unidades Produzidas</option>
                <option value="HORAS_TRABALHADAS">Horas Trabalhadas</option>
              </select></div>
          </div>
          <div><label className={lbl}>Documento de Origem (NF, Contrato...)</label><input className="input w-80" value={form.documentOrigin} onChange={f('documentOrigin')} /></div>
        </Section>

        <Section title="Contas Contábeis">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className={lbl}>Conta do Ativo</label><input className="input" value={form.assetAccountCode} onChange={f('assetAccountCode')} /></div>
            <div><label className={lbl}>Depreciação Acumulada</label><input className="input" value={form.accumDeprecAccountCode} onChange={f('accumDeprecAccountCode')} /></div>
            <div><label className={lbl}>Despesa de Depreciação</label><input className="input" value={form.deprecExpenseAccountCode} onChange={f('deprecExpenseAccountCode')} /></div>
          </div>
          <div><label className={lbl}>Notas Técnicas</label><textarea className="input min-h-[80px]" value={form.technicalNotes} onChange={f('technicalNotes')} /></div>
        </Section>

        <div className="flex gap-3 justify-end">
          <button type="button" className="rounded-xl border border-slate-300 px-6 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={() => navigate('/patrimonio/bens')}>Cancelar</button>
          <button type="submit" className="rounded-xl bg-sky-500 px-6 py-2 text-sm font-medium text-white hover:bg-sky-600">{isEdit ? 'Salvar Alterações' : 'Cadastrar Bem'}</button>
        </div>
      </form>
    </div>
  );
}
