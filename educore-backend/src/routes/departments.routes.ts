import { Router } from 'express';
import * as ctrl from '../controllers/departments.controller';
import { jwtAuth } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';

const router = Router();

router.use(jwtAuth);

router.get('/',                  roleGuard(['admin', 'principal', 'hod', 'teacher']), ctrl.list);
router.put('/:id/hod',           roleGuard(['principal']),                            ctrl.assignHod);
router.post('/:id/teachers',     roleGuard(['hod']),                                  ctrl.assignTeacher);

export default router;
