import { Router } from 'express';
import {
  shortenUrl,
  getUrlStats,
  updateUrl,
  deleteUrl
} from '../controllers/urlController.js';

const router = Router();

router.post('/shorten', shortenUrl);
router.get('/:shortCode/stats', getUrlStats);
router.put('/:shortCode', updateUrl);
router.delete('/:shortCode', deleteUrl);

export default router;