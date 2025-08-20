import { Router } from 'express';
import { redirectToOriginalUrl, verifyPasswordAndRedirect } from '../controllers/urlController.js';

const router = Router();

router.get('/:shortCode', redirectToOriginalUrl);

router.post('/:shortCode/verify', verifyPasswordAndRedirect);

export default router;