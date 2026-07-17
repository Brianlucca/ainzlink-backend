export const CUSTOM_CODE_PATTERN = /^[a-zA-Z0-9_-]{3,40}$/;

export const isValidHttpUrl = (value) => {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

export const parseFutureExpiration = (value, now = new Date()) => {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date > now ? date : null;
};
