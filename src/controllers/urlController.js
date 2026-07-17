import { urlService } from '../services/urlService.js';
import { getRequestContext } from '../utils/requestContext.js';

export const shortenUrl = async (req, res) => {
  res.status(201).json(await urlService.create(req.body, req.user));
};

export const listUrls = async (req, res) => {
  res.json(await urlService.list(req.user));
};

export const claimUrl = async (req, res) => {
  res.json(await urlService.claim(req.params.shortCode, req.body.token, req.user));
};

export const redirectToOriginalUrl = async (req, res) => {
  res.json(await urlService.resolve(
    req.params.shortCode,
    getRequestContext(req),
    req.query.preview === 'confirmed',
    req.query.destination,
  ));
};

export const verifyPasswordAndRedirect = async (req, res) => {
  res.json(await urlService.verifyPassword(
    req.params.shortCode,
    req.body.password,
    getRequestContext(req),
    req.body.destinationToken,
  ));
};

export const getUrlStats = async (req, res) => {
  res.json(await urlService.getStats(req.params.shortCode, req.query.token, req.user));
};

export const getUrlAnalytics = async (req, res) => {
  res.json(await urlService.getAnalytics(req.params.shortCode, req.query.token, req.user));
};

export const updateUrl = async (req, res) => {
  await urlService.update(req.params.shortCode, req.query.token, req.user, req.body);
  res.json({ message: 'Link atualizado com sucesso.' });
};

export const deleteUrl = async (req, res) => {
  await urlService.delete(req.params.shortCode, req.query.token, req.user);
  res.json({ message: 'Link deletado com sucesso.' });
};

export const reportUrl = async (req, res) => {
  res.status(201).json(await urlService.report(
    req.params.shortCode,
    req.body.reason,
    getRequestContext(req),
  ));
};
