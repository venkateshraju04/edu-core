import { Router } from 'express';
import { jwtAuth } from '../middleware/auth';
import { chat } from '../controllers/chat.controller';

const router = Router();

// POST /api/chat — send a message and get a response
router.post('/', jwtAuth, chat);

export default router;
