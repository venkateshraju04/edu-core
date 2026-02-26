import { Router } from 'express';
import * as ctrl from '../controllers/admissions.controller';
import { jwtAuth } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';

const router = Router();

router.use(jwtAuth, roleGuard(['admin']));

router.get('/',               ctrl.list);
router.post('/',              ctrl.create);
router.patch('/:id/approve',  ctrl.approve);
router.patch('/:id/reject',   ctrl.reject);

export default router;
