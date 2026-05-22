import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { apiRoutes } from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { env } from './utils/env.js';

export const app = express();

app.use(
  cors({
    origin: env.frontendUrl,
  }),
);
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));
app.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
});
app.use('/api', apiRoutes);
app.use(errorHandler);
