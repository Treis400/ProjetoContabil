import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';

const uploadDir = path.resolve(process.cwd(), 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export const upload = multer({
  storage: multer.diskStorage({
    destination: (_request, _file, callback) => {
      callback(null, uploadDir);
    },
    filename: (_request, file, callback) => {
      const safeName = file.originalname.replace(/\s+/g, '-');
      callback(null, `${Date.now()}-${safeName}`);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});
