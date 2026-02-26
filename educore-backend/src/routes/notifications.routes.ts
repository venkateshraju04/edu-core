import { Router } from 'express';
import * as ctrl from '../controllers/notifications.controller';
import { jwtAuth } from '../middleware/auth';

const router = Router();

router.use(jwtAuth);

router.get('/',              ctrl.list);
router.patch('/:id/read',    ctrl.markRead);

export default router;
