import { Router } from 'express';
import * as ctrl from '../controllers/lessonPlans.controller';
import { jwtAuth } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';

const router = Router();

router.use(jwtAuth);

router.get('/',                 roleGuard(['teacher', 'hod', 'principal']), ctrl.list);
router.get('/:id',              roleGuard(['teacher', 'hod', 'principal']), ctrl.getOne);
router.post('/',                roleGuard(['teacher']),                     ctrl.create);
router.put('/:id',              roleGuard(['teacher']),                     ctrl.update);
router.patch('/:id/approve',    roleGuard(['hod']),                         ctrl.approve);
router.patch('/:id/reject',     roleGuard(['hod']),                         ctrl.reject);

export default router;
