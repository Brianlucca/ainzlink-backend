import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { AppError } from './errors/AppError.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import urlRoutes from './routes/urlRoutes.js';

const corsOptions = {
  origin(origin, callback) {
    if (!origin || env.corsOrigins.includes(origin.replace(/\/+$/, ''))) {
      return callback(null, true);
    }
    return callback(new AppError('Origem nao permitida pelo CORS.', 403, 'CORS_DENIED'));
  },
};

const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: 'Muitas requisicoes. Tente novamente mais tarde.',
    code: 'RATE_LIMITED',
  },
});

export const createApp = () => {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.set({
      'Cache-Control': 'no-store',
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
    });
    next();
  });
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '16kb' }));

  app.get('/', (req, res) => {
    res.json({ message: 'AinzLink API esta no ar.', environment: env.nodeEnv });
  });
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  app.get('/favicon.ico', (req, res) => res.status(204).end());

  app.use('/api/v1', apiLimiter);
  app.use('/api/v1/urls', urlRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export { corsOptions };
