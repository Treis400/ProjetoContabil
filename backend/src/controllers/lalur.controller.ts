import type { Request, Response } from 'express';
import * as svc from '../services/lalur.service.js';

const cid = (req: Request): string => String((req.query as any).clientId ?? '');
const pm = (req: Request) => req.params as Record<string, string>;
const uid = (req: Request): string | undefined => (req as any).user?.id;

// ── Tipos de ajuste ───────────────────────────────────────────────────────────
export async function listAdjustTypes(req: Request, res: Response) { res.json(await svc.listAdjustTypes(cid(req))); }
export async function createAdjustType(req: Request, res: Response) { res.status(201).json(await svc.createAdjustType(cid(req), req.body)); }
export async function updateAdjustType(req: Request, res: Response) { res.json(await svc.updateAdjustType(pm(req).id, cid(req), req.body)); }
export async function deleteAdjustType(req: Request, res: Response) { await svc.deleteAdjustType(pm(req).id); res.status(204).send(); }

// ── Regras de integração contábil ─────────────────────────────────────────────
export async function listAccountingRules(req: Request, res: Response) { res.json(await svc.listAccountingRules(cid(req))); }
export async function createAccountingRule(req: Request, res: Response) { res.status(201).json(await svc.createAccountingRule(cid(req), req.body)); }
export async function updateAccountingRule(req: Request, res: Response) { res.json(await svc.updateAccountingRule(pm(req).id, req.body)); }
export async function deleteAccountingRule(req: Request, res: Response) { await svc.deleteAccountingRule(pm(req).id); res.status(204).send(); }

// ── Períodos LALUR ────────────────────────────────────────────────────────────
export async function listPeriods(req: Request, res: Response) { res.json(await svc.listLalurPeriods(cid(req))); }
export async function getPeriod(req: Request, res: Response) {
  const data = await svc.getLalurPeriod(cid(req), Number(pm(req).year));
  if (!data) return res.status(404).json({ error: 'Período não encontrado' });
  res.json(data);
}
export async function upsertPeriod(req: Request, res: Response) { res.json(await svc.upsertLalurPeriod(cid(req), Number(pm(req).year), req.body)); }
export async function lockPeriod(req: Request, res: Response) { res.json(await svc.lockLalurPeriod(cid(req), Number(pm(req).year), uid(req))); }
export async function unlockPeriod(req: Request, res: Response) { res.json(await svc.unlockLalurPeriod(cid(req), Number(pm(req).year), uid(req))); }

// ── Parte A ───────────────────────────────────────────────────────────────────
export async function listPartA(req: Request, res: Response) { res.json(await svc.listPartAEntries(pm(req).periodId)); }
export async function createPartA(req: Request, res: Response) { res.status(201).json(await svc.createPartAEntry(pm(req).periodId, req.body, uid(req))); }
export async function updatePartA(req: Request, res: Response) { res.json(await svc.updatePartAEntry(pm(req).id, req.body, uid(req))); }
export async function deletePartA(req: Request, res: Response) { await svc.deletePartAEntry(pm(req).id, uid(req)); res.status(204).send(); }

// ── Parte B ───────────────────────────────────────────────────────────────────
export async function listPartB(req: Request, res: Response) { res.json(await svc.listPartBBalances(pm(req).periodId)); }
export async function createPartB(req: Request, res: Response) { res.status(201).json(await svc.createPartBBalance(pm(req).periodId, req.body, uid(req))); }
export async function updatePartB(req: Request, res: Response) { res.json(await svc.updatePartBBalance(pm(req).id, req.body, uid(req))); }
export async function deletePartB(req: Request, res: Response) { await svc.deletePartBBalance(pm(req).id, uid(req)); res.status(204).send(); }

// ── Movimentações Parte B ─────────────────────────────────────────────────────
export async function listPartBMovements(req: Request, res: Response) { res.json(await svc.listPartBMovements(pm(req).balanceId)); }
export async function createPartBMovement(req: Request, res: Response) { res.status(201).json(await svc.createPartBMovement(pm(req).balanceId, req.body, uid(req))); }

// ── Compensações ──────────────────────────────────────────────────────────────
export async function listCompensations(req: Request, res: Response) {
  const { type } = req.query as any;
  res.json(await svc.listCompensations(cid(req), type));
}
export async function createCompensation(req: Request, res: Response) {
  res.status(201).json(await svc.createCompensation(cid(req), pm(req).periodId, req.body));
}
export async function calcCompensationLimit(req: Request, res: Response) {
  res.json(await svc.calcCompensationLimit(cid(req), Number(pm(req).year)));
}
export async function applyCompensation(req: Request, res: Response) {
  try { res.json(await svc.applyCompensation(cid(req), Number(pm(req).year), req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
}

// ── Integração contábil ───────────────────────────────────────────────────────
export async function importAccountingResult(req: Request, res: Response) {
  try { res.json(await svc.importAccountingResult(cid(req), Number(pm(req).year), uid(req))); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
}
export async function listAccountingImports(req: Request, res: Response) {
  res.json(await svc.listAccountingImports(pm(req).periodId));
}

// ── IRPJ/CSLL ─────────────────────────────────────────────────────────────────
export async function calcIrpjCsll(req: Request, res: Response) { res.json(await svc.calcIrpjCsll(pm(req).periodId, req.body)); }

// ── ECF ───────────────────────────────────────────────────────────────────────
export async function listEcf(req: Request, res: Response) { res.json(await svc.listEcfFiles(cid(req))); }
export async function generateEcf(req: Request, res: Response) { res.json(await svc.generateEcf(cid(req), Number(pm(req).year))); }
export async function downloadEcf(req: Request, res: Response) {
  const clientId = cid(req);
  const { prisma } = await import('../prisma/client.js');
  const file = await prisma.ecfFile.findUnique({
    where: { clientId_periodYear: { clientId, periodYear: Number(pm(req).year) } },
  });
  if (!file?.fileContent) return res.status(404).json({ error: 'ECF não encontrada' });
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
  res.send(file.fileContent);
}

// ── Audit Log ─────────────────────────────────────────────────────────────────
export async function listAuditLogs(req: Request, res: Response) {
  const { periodId } = req.query as any;
  res.json(await svc.listAuditLogs(cid(req), periodId));
}
