import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import { env } from '../config/env.js';
import { AppError } from '../errors/AppError.js';
import { urlRepository } from '../repositories/urlRepository.js';
import {
  CUSTOM_CODE_PATTERN,
  isValidHttpUrl,
  parseFutureExpiration,
} from '../utils/urlValidation.js';

const toDate = (value) => value?.toDate?.() || value || null;

const requireUrl = (value) => {
  if (!value || !isValidHttpUrl(value)) {
    throw new AppError('Informe uma URL HTTP ou HTTPS válida.', 400, 'INVALID_URL');
  }
  const hostname = new URL(value).hostname.toLowerCase();
  if (
    hostname === 'localhost'
    || hostname === '0.0.0.0'
    || hostname === '127.0.0.1'
    || hostname === '::1'
    || /^10\./.test(hostname)
    || /^192\.168\./.test(hostname)
  ) {
    throw new AppError('Destinos locais ou privados não são permitidos.', 400, 'UNSAFE_DESTINATION');
  }
};

const normalizeDestinations = (originalUrl, destinations = []) => {
  const normalized = destinations.length
    ? destinations.map((item) => ({
      url: item.url,
      weight: Math.max(1, Number(item.weight) || 1),
      label: item.label?.trim() || '',
    }))
    : [{ url: originalUrl, weight: 100, label: 'Principal' }];
  normalized.forEach((item) => requireUrl(item.url));
  return normalized;
};

const normalizeRules = (rules = []) => rules
  .filter((rule) => rule?.url && rule?.type && rule?.value)
  .map((rule) => {
    requireUrl(rule.url);
    return {
      type: rule.type,
      value: String(rule.value).toLowerCase(),
      url: rule.url,
    };
  });

const requireLink = async (shortCode) => {
  const link = await urlRepository.findByCode(shortCode);
  if (!link) throw new AppError('Link não encontrado.', 404, 'LINK_NOT_FOUND');
  return link;
};

const canAdmin = (link, token, user) => (
  (token && link.adminToken === token)
  || (user?.uid && link.ownerId === user.uid)
);

const requireAdmin = async (shortCode, token, user) => {
  const link = await requireLink(shortCode);
  if (!canAdmin(link, token, user)) {
    throw new AppError('Acesso negado.', user ? 403 : 401, 'ADMIN_REQUIRED');
  }
  return link;
};

const pickDestination = (link, context) => {
  const matchingRule = (link.rules || []).find((rule) => (
    (rule.type === 'device' && rule.value === context.device)
    || (rule.type === 'country' && rule.value === context.country.toLowerCase())
  ));
  if (matchingRule) return matchingRule.url;

  const destinations = link.destinations?.length
    ? link.destinations
    : [{ url: link.originalUrl, weight: 1 }];
  const total = destinations.reduce((sum, item) => sum + item.weight, 0);
  let cursor = Math.random() * total;
  for (const destination of destinations) {
    cursor -= destination.weight;
    if (cursor <= 0) return destination.url;
  }
  return destinations[0].url;
};

const getAllowedDestinations = (link) => [
  link.originalUrl,
  ...(link.destinations || []).map((item) => item.url),
  ...(link.rules || []).map((rule) => rule.url),
];

const encodeDestination = (destination) => Buffer.from(destination).toString('base64url');

const decodeDestination = (token) => {
  try {
    return Buffer.from(token, 'base64url').toString('utf8');
  } catch {
    return null;
  }
};

const getAvailability = (link, now = new Date()) => {
  if (link.status === 'disabled') return ['LINK_DISABLED', 'Este link está desativado.'];
  const startsAt = toDate(link.startsAt);
  if (startsAt && startsAt > now) return ['LINK_NOT_STARTED', 'Este link ainda não está ativo.'];
  const expiresAt = toDate(link.expiresAt);
  if (expiresAt && expiresAt < now) return ['LINK_EXPIRED', 'Este link expirou.'];
  return null;
};

const serialize = (link) => ({
  shortCode: link.shortCode,
  originalUrl: link.originalUrl,
  shortUrl: `${env.appUrl}/${link.shortCode}`,
  adminUrl: `${env.appUrl}/admin/${link.shortCode}#token=${link.adminToken}`,
  clicks: link.clicks || 0,
  createdAt: toDate(link.createdAt),
  startsAt: toDate(link.startsAt),
  expiresAt: toDate(link.expiresAt),
  passwordProtected: Boolean(link.passwordHash),
  status: link.status || 'active',
  reportCount: link.reportCount || 0,
  moderationStatus: (link.reportCount || 0) >= 10 ? 'under_review' : 'clear',
  previewEnabled: true,
  destinations: link.destinations || [{ url: link.originalUrl, weight: 100, label: 'Principal' }],
  rules: link.rules || [],
  qrStyle: link.qrStyle || {
    foreground: '#111827',
    background: '#ffffff',
  },
});

const groupAnalytics = (events) => {
  const increment = (target, key) => {
    target[key || 'Desconhecido'] = (target[key || 'Desconhecido'] || 0) + 1;
  };
  const result = { daily: {}, devices: {}, browsers: {}, countries: {}, recent: [] };
  events.forEach((event) => {
    const createdAt = toDate(event.createdAt);
    increment(result.daily, createdAt?.toISOString?.().slice(0, 10));
    increment(result.devices, event.device);
    increment(result.browsers, event.browser);
    increment(result.countries, event.country);
  });
  result.recent = events.slice(0, 20).map((event) => ({
    device: event.device,
    browser: event.browser,
    country: event.country,
    destination: event.destination,
    createdAt: toDate(event.createdAt),
  }));
  return result;
};

export const urlService = {
  async create(input, user) {
    requireUrl(input.originalUrl);
    const normalizedCode = input.customCode?.trim();
    if (normalizedCode && !CUSTOM_CODE_PATTERN.test(normalizedCode)) {
      throw new AppError('Alias inválido. Use de 3 a 40 letras, números, _ ou -.', 400, 'INVALID_CUSTOM_CODE');
    }
    if (normalizedCode && await urlRepository.findByCode(normalizedCode)) {
      throw new AppError('Este nome personalizado já está em uso.', 409, 'CODE_IN_USE');
    }

    const shortCode = normalizedCode || nanoid(8);
    const adminToken = nanoid(32);
    const data = {
      originalUrl: input.originalUrl,
      shortCode,
      adminToken,
      ownerId: user?.uid || null,
      ownerEmail: user?.email || null,
      createdAt: new Date(),
      clicks: 0,
      status: 'active',
      previewEnabled: true,
      destinations: normalizeDestinations(input.originalUrl, input.destinations),
      rules: normalizeRules(input.rules),
      reportCount: 0,
      qrStyle: {
        foreground: '#111827',
        background: '#ffffff',
      },
    };
    if (input.password) data.passwordHash = await bcrypt.hash(input.password, 10);
    if (input.startsAt) {
      const startsAt = new Date(input.startsAt);
      if (Number.isNaN(startsAt.getTime())) throw new AppError('Data inicial inválida.', 400, 'INVALID_START');
      data.startsAt = startsAt;
    }
    if (input.expiresAt) {
      const expiration = parseFutureExpiration(input.expiresAt);
      if (!expiration) throw new AppError('Data de expiração inválida.', 400, 'INVALID_EXPIRATION');
      data.expiresAt = expiration;
    }
    if (data.startsAt && data.expiresAt && data.expiresAt <= data.startsAt) {
      throw new AppError('A expiração deve ser posterior ao início.', 400, 'INVALID_SCHEDULE');
    }
    await urlRepository.create(shortCode, data);
    return serialize(data);
  },

  async resolve(shortCode, context, previewConfirmed = false, destinationToken = null) {
    const link = await requireLink(shortCode);
    const unavailable = getAvailability(link);
    if (unavailable) throw new AppError(unavailable[1], unavailable[0] === 'LINK_UNDER_REVIEW' ? 423 : 410, unavailable[0]);
    const selectedDestination = destinationToken ? decodeDestination(destinationToken) : null;
    const destination = selectedDestination && getAllowedDestinations(link).includes(selectedDestination)
      ? selectedDestination
      : pickDestination(link, context);
    if (!previewConfirmed) {
      return {
        previewRequired: true,
        destinationHost: new URL(destination).hostname,
        destinationToken: encodeDestination(destination),
      };
    }
    if (link.passwordHash) return { passwordProtected: true };
    await urlRepository.incrementClicks(shortCode);
    await urlRepository.addAnalyticsEvent(shortCode, { ...context, destination, createdAt: new Date() });
    return { originalUrl: destination };
  },

  async verifyPassword(shortCode, password, context, destinationToken = null) {
    const link = await requireLink(shortCode);
    const unavailable = getAvailability(link);
    if (unavailable) throw new AppError(unavailable[1], 410, unavailable[0]);
    if (!password || !link.passwordHash || !await bcrypt.compare(password, link.passwordHash)) {
      throw new AppError('Senha incorreta.', 401, 'INVALID_PASSWORD');
    }
    const selectedDestination = destinationToken ? decodeDestination(destinationToken) : null;
    const destination = selectedDestination && getAllowedDestinations(link).includes(selectedDestination)
      ? selectedDestination
      : pickDestination(link, context);
    await urlRepository.incrementClicks(shortCode);
    await urlRepository.addAnalyticsEvent(shortCode, { ...context, destination, createdAt: new Date() });
    return { originalUrl: destination };
  },

  async list(user) {
    const links = await urlRepository.listByOwner(user.uid);
    return links.sort((a, b) => toDate(b.createdAt) - toDate(a.createdAt)).map(serialize);
  },

  async claim(shortCode, token, user) {
    const link = await requireAdmin(shortCode, token, null);
    if (link.ownerId && link.ownerId !== user.uid) {
      throw new AppError('Este link já pertence a outro usuário.', 409, 'ALREADY_CLAIMED');
    }
    await urlRepository.update(shortCode, { ownerId: user.uid, ownerEmail: user.email || null });
    return { message: 'Link adicionado ao seu dashboard.' };
  },

  async getStats(shortCode, token, user) {
    return serialize(await requireAdmin(shortCode, token, user));
  },

  async getAnalytics(shortCode, token, user) {
    await requireAdmin(shortCode, token, user);
    return groupAnalytics(await urlRepository.listAnalytics(shortCode));
  },

  async update(shortCode, token, user, input) {
    const link = await requireAdmin(shortCode, token, user);
    const updates = {};
    if (input.originalUrl !== undefined) {
      requireUrl(input.originalUrl);
      updates.originalUrl = input.originalUrl;
    }
    if (input.password !== undefined) updates.passwordHash = input.password ? await bcrypt.hash(input.password, 10) : null;
    if (input.status !== undefined) updates.status = input.status;
    if (input.startsAt !== undefined) {
      const startsAt = input.startsAt ? new Date(input.startsAt) : null;
      if (startsAt && Number.isNaN(startsAt.getTime())) {
        throw new AppError('Data inicial inválida.', 400, 'INVALID_START');
      }
      updates.startsAt = startsAt;
    }
    if (input.expiresAt !== undefined) {
      const expiresAt = input.expiresAt ? parseFutureExpiration(input.expiresAt) : null;
      if (input.expiresAt && !expiresAt) {
        throw new AppError('Data de expiração inválida.', 400, 'INVALID_EXPIRATION');
      }
      updates.expiresAt = expiresAt;
    }
    const effectiveStartsAt = updates.startsAt !== undefined ? updates.startsAt : toDate(link.startsAt);
    const effectiveExpiresAt = updates.expiresAt !== undefined ? updates.expiresAt : toDate(link.expiresAt);
    if (effectiveStartsAt && effectiveExpiresAt && effectiveExpiresAt <= effectiveStartsAt) {
      throw new AppError('A expiração deve ser posterior ao início.', 400, 'INVALID_SCHEDULE');
    }
    if (input.destinations !== undefined) updates.destinations = normalizeDestinations(input.originalUrl, input.destinations);
    if (input.rules !== undefined) updates.rules = normalizeRules(input.rules);
    if (input.qrStyle !== undefined) {
      updates.qrStyle = {
        foreground: input.qrStyle.foreground || '#111827',
        background: input.qrStyle.background || '#ffffff',
      };
    }
    if (!Object.keys(updates).length) throw new AppError('Nenhuma informação para atualizar.', 400, 'EMPTY_UPDATE');
    await urlRepository.update(shortCode, updates);
  },

  async delete(shortCode, token, user) {
    await requireAdmin(shortCode, token, user);
    await urlRepository.delete(shortCode);
  },

  async report(shortCode, reason, context) {
    await requireLink(shortCode);
    await urlRepository.report(shortCode, {
      reason: reason || 'Suspeito',
      ...context,
      createdAt: new Date(),
    });
    return { message: 'Denúncia recebida.' };
  },

  authorizeAdmin(shortCode, token, user) {
    return requireAdmin(shortCode, token, user);
  },
};
