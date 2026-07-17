import { env } from '../config/env.js';
import { AppError } from '../errors/AppError.js';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TEST_SECRET_KEYS = new Set([
  '1x0000000000000000000000000000000AA',
  '2x0000000000000000000000000000000AA',
  '3x0000000000000000000000000000000AA',
]);

export const verifyTurnstile = (expectedAction) => async (req, res, next) => {
  try {
    const token = req.body?.turnstileToken;
    if (!token) {
      return next(new AppError(
        'Conclua a verificação de segurança.',
        400,
        'TURNSTILE_REQUIRED',
      ));
    }

    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: env.turnstileSecretKey,
        response: token,
      }),
      signal: AbortSignal.timeout(10000),
    });
    const result = await response.json();

    const isOfficialTestKey = TEST_SECRET_KEYS.has(env.turnstileSecretKey);
    const actionMatches = isOfficialTestKey
      ? result.action === undefined || result.action === 'test'
      : result.action === expectedAction;
    const hostnameMatches = isOfficialTestKey
      || (
        env.turnstileAllowedHostnames.length > 0
        && env.turnstileAllowedHostnames.includes(result.hostname?.toLowerCase())
      );

    if (!result.success || !actionMatches || !hostnameMatches) {
      console.warn('Turnstile recusado:', {
        success: result.success,
        action: result.action,
        expectedAction: isOfficialTestKey ? 'test' : expectedAction,
        hostname: result.hostname,
        errorCodes: result['error-codes'],
      });
      return next(new AppError(
        'A verificacao de seguranca expirou ou falhou. Tente novamente.',
        403,
        'TURNSTILE_FAILED',
      ));
    }

    delete req.body.turnstileToken;
    return next();
  } catch (error) {
    console.error('Erro ao validar Turnstile:', error.message);
    return next(new AppError(
      'Nao foi possivel validar a seguranca agora.',
      503,
      'TURNSTILE_UNAVAILABLE',
    ));
  }
};
