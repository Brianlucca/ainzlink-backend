const required = (name, fallback) => {
  const value = process.env[name] || fallback;

  if (!value) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }

  return value.replace(/\/+$/, '');
};

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5001),
  appUrl: required('APP_URL', process.env.BASE_URL),
  corsOrigins: required('CORS_ORIGIN')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean),
  turnstileSecretKey: required('TURNSTILE_SECRET_KEY'),
  turnstileAllowedHostnames: (process.env.TURNSTILE_ALLOWED_HOSTNAMES || '')
    .split(',')
    .map((hostname) => hostname.trim().toLowerCase())
    .filter(Boolean),
});
