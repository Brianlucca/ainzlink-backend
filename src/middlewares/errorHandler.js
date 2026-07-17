import { AppError } from '../errors/AppError.js';

export const notFoundHandler = (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.', code: 'ROUTE_NOT_FOUND' });
};

export const errorHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);

  const isOperational = error instanceof AppError;
  if (!isOperational) console.error(error);

  return res.status(isOperational ? error.statusCode : 500).json({
    error: isOperational ? error.message : 'Erro interno no servidor.',
    code: isOperational ? error.code : 'INTERNAL_ERROR',
  });
};
