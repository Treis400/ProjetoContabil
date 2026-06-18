import { Request, Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.middleware.js';
import { getRequiredString } from '../utils/request.js';
import * as svc from '../services/fiscal-obligation.service.js';
import * as bookSvc from '../services/fiscal-books.service.js';

// ── Obrigações ────────────────────────────────────────────────────────────────

export async function listObligations(req: Request, res: Response) {
  try {
    const clientId = getRequiredString(req.query.clientId, 'clientId');
    const year = req.query.year ? Number(req.query.year) : undefined;
    res.json(await svc.listObligations(clientId, year));
  } catch (e: unknown) {
    res.status(400).json({ message: e instanceof Error ? e.message : 'Erro' });
  }
}

export async function createObligation(req: Request, res: Response) {
  try {
    const userId = (req as AuthRequest).user?.id;
    res.status(201).json(await svc.createObligation({ ...req.body, userId }));
  } catch (e: unknown) {
    res.status(400).json({ message: e instanceof Error ? e.message : 'Erro' });
  }
}

export async function generateObligation(req: Request, res: Response) {
  try {
    const id = getRequiredString(req.params.id, 'id');
    const result = await svc.generateObligation(id);

    // Se solicitado download direto
    if (req.query.download === 'true') {
      const isXml = result.fileName.endsWith('.xml');
      res.setHeader('Content-Type', isXml ? 'application/xml' : 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
      return res.send(result.content);
    }

    res.json({ fileName: result.fileName, size: result.content.length });
  } catch (e: unknown) {
    res.status(400).json({ message: e instanceof Error ? e.message : 'Erro ao gerar' });
  }
}

export async function downloadObligation(req: Request, res: Response) {
  try {
    const id = getRequiredString(req.params.id, 'id');
    const ob = await svc.getObligation(id);
    if (!ob.fileContent || !ob.fileName) {
      return res.status(404).json({ message: 'Arquivo ainda não gerado.' });
    }
    const isXml = ob.fileName.endsWith('.xml');
    res.setHeader('Content-Type', isXml ? 'application/xml' : 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${ob.fileName}"`);
    res.send(ob.fileContent);
  } catch (e: unknown) {
    res.status(404).json({ message: e instanceof Error ? e.message : 'Não encontrado' });
  }
}

export async function markTransmitted(req: Request, res: Response) {
  try {
    const id = getRequiredString(req.params.id, 'id');
    res.json(await svc.markTransmitted(id));
  } catch (e: unknown) {
    res.status(400).json({ message: e instanceof Error ? e.message : 'Erro' });
  }
}

export async function markDispensed(req: Request, res: Response) {
  try {
    const id = getRequiredString(req.params.id, 'id');
    res.json(await svc.markDispensed(id, req.body.notes));
  } catch (e: unknown) {
    res.status(400).json({ message: e instanceof Error ? e.message : 'Erro' });
  }
}

export async function deleteObligation(req: Request, res: Response) {
  try {
    const id = getRequiredString(req.params.id, 'id');
    await svc.deleteObligation(id);
    res.status(204).send();
  } catch (e: unknown) {
    res.status(400).json({ message: e instanceof Error ? e.message : 'Erro' });
  }
}

// ── Livros ────────────────────────────────────────────────────────────────────

export async function listBooks(req: Request, res: Response) {
  try {
    const clientId = getRequiredString(req.query.clientId, 'clientId');
    const year = req.query.year ? Number(req.query.year) : undefined;
    res.json(await bookSvc.listBooks(clientId, year));
  } catch (e: unknown) {
    res.status(400).json({ message: e instanceof Error ? e.message : 'Erro' });
  }
}

export async function generateBook(req: Request, res: Response) {
  try {
    const userId = (req as AuthRequest).user?.id;
    const { clientId, bookType, periodMonth, periodYear } = req.body;
    const book = await bookSvc.generateBook(clientId, bookType, Number(periodMonth), Number(periodYear), userId);
    res.status(201).json(book);
  } catch (e: unknown) {
    res.status(400).json({ message: e instanceof Error ? e.message : 'Erro ao gerar livro' });
  }
}

export async function downloadBook(req: Request, res: Response) {
  try {
    const id = getRequiredString(req.params.id, 'id');
    const book = await bookSvc.getBookContent(id);
    if (!book.fileContent) return res.status(404).json({ message: 'Conteúdo não disponível.' });
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="Livro_${book.bookType}_${book.periodYear}${String(book.periodMonth).padStart(2, '0')}.txt"`);
    res.send(book.fileContent);
  } catch (e: unknown) {
    res.status(404).json({ message: e instanceof Error ? e.message : 'Não encontrado' });
  }
}

export async function deleteBook(req: Request, res: Response) {
  try {
    const id = getRequiredString(req.params.id, 'id');
    await bookSvc.deleteBook(id);
    res.status(204).send();
  } catch (e: unknown) {
    res.status(400).json({ message: e instanceof Error ? e.message : 'Erro' });
  }
}
