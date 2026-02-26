import { Router } from 'express';
import * as ctrl from '../controllers/students.controller';
import { jwtAuth } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';

const router = Router();

router.use(jwtAuth);

router.get('/',                     roleGuard(['admin', 'principal', 'hod']), ctrl.list);
router.get('/class/:classId',       roleGuard(['admin', 'hod', 'teacher']),  ctrl.listByClass);
router.get('/:id',                  roleGuard(['admin', 'principal', 'hod', 'teacher']), ctrl.getOne);
router.post('/',                    roleGuard(['admin']),                     ctrl.create);
router.put('/:id',                  roleGuard(['admin']),                     ctrl.update);

export default router;
