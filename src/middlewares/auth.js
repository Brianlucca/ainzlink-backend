import { auth } from '../config/firebase.js';
import { AppError } from '../errors/AppError.js';

const readBearerToken = (req) => {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
};

export const optionalAuth = async (req, res, next) => {
  try {
    const token = readBearerToken(req);
    req.user = token ? await auth.verifyIdToken(token) : null;
    next();
  } catch {
    next(new AppError('Sessão inválida ou expirada.', 401, 'INVALID_SESSION'));
  }
};

export const requireAuth = async (req, res, next) => {
  await optionalAuth(req, res, (error) => {
    if (error) return next(error);
    if (!req.user) return next(new AppError('Login obrigatório.', 401, 'AUTH_REQUIRED'));
    return next();
  });
};
