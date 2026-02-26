import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { jwtAuth } from '../middleware/auth';

const router = Router();

router.post('/login',  authController.login);
router.post('/logout', jwtAuth, authController.logout);
router.get('/me',      jwtAuth, authController.me);

export default router;
