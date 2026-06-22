import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

const uploadDir = path.resolve(process.cwd(), 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/xml',
  'text/xml',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
]);

const ALLOWED_EXTENSIONS = new Set([
  '.pdf', '.xml', '.jpg', '.jpeg', '.png', '.gif',
  '.xls', '.xlsx', '.doc', '.docx', '.txt', '.csv',
]);

function sanitizeFilename(original: string): string {
  const ext = path.extname(original).toLowerCase();
  const base = path.basename(original, ext)
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .slice(0, 100);
  return `${base}${ext}`;
}

function fileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !ALLOWED_EXTENSIONS.has(ext)) {
    return cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}`));
  }

  cb(null, true);
}

export const upload = multer({
  storage: multer.diskStorage({
    destination: (_request, _file, callback) => {
      callback(null, uploadDir);
    },
    filename: (_request, file, callback) => {
      const safeName = sanitizeFilename(file.originalname);
      const uniqueId = crypto.randomBytes(8).toString('hex');
      callback(null, `${Date.now()}-${uniqueId}-${safeName}`);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
  fileFilter,
});
