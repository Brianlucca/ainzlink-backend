import { Router } from 'express';
import {
  claimUrl,
  deleteUrl,
  getUrlAnalytics,
  getUrlStats,
  listUrls,
  redirectToOriginalUrl,
  reportUrl,
  shortenUrl,
  updateUrl,
  verifyPasswordAndRedirect,
} from '../controllers/urlController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { optionalAuth, requireAuth } from '../middlewares/auth.js';
import { verifyTurnstile } from '../middlewares/turnstile.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(listUrls));
router.post('/', optionalAuth, verifyTurnstile('create_link'), asyncHandler(shortenUrl));
router.post('/:shortCode/claim', requireAuth, asyncHandler(claimUrl));
router.get('/:shortCode/stats', optionalAuth, asyncHandler(getUrlStats));
router.get('/:shortCode/analytics', optionalAuth, asyncHandler(getUrlAnalytics));
router.put('/:shortCode', optionalAuth, asyncHandler(updateUrl));
router.delete('/:shortCode', optionalAuth, asyncHandler(deleteUrl));
router.post('/:shortCode/report', verifyTurnstile('report_link'), asyncHandler(reportUrl));
router.post('/:shortCode/verify', asyncHandler(verifyPasswordAndRedirect));
router.get('/:shortCode', asyncHandler(redirectToOriginalUrl));

export default router;
