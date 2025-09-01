import { Router } from 'express';
import {
  shortenUrl,
  getUrlStats,
  updateUrl,
  deleteUrl,
  redirectToOriginalUrl,
  verifyPasswordAndRedirect
} from '../controllers/urlController.js';

const router = Router();

router.post('/shorten', shortenUrl);
router.get('/:shortCode/stats', getUrlStats);
router.put('/:shortCode', updateUrl);
router.delete('/:shortCode', deleteUrl);
router.get('/:shortCode', redirectToOriginalUrl);
router.post('/:shortCode/verify', verifyPasswordAndRedirect);

export default router;