import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'node:path';
import { apiRoutes } from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { globalRateLimit } from './middlewares/rate-limit.middleware.js';
import { sanitizeInput } from './middlewares/sanitize.middleware.js';
import { env } from './utils/env.js';

export const app = express();

app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);

app.use(
  cors({
    origin: env.frontendUrl,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  }),
);

app.use(globalRateLimit);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(sanitizeInput);

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.use('/api', apiRoutes);
app.use(errorHandler);
