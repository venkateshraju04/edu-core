import { Router } from 'express';
import * as ctrl from '../controllers/teachers.controller';
import { jwtAuth } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';

const router = Router();

router.use(jwtAuth);

router.get('/',                         roleGuard(['admin', 'principal', 'hod']), ctrl.list);
router.get('/department/:deptId',       roleGuard(['principal', 'hod']),          ctrl.listByDepartment);
router.get('/:id',                      roleGuard(['admin', 'principal', 'hod']), ctrl.getOne);
router.post('/',                        roleGuard(['admin']),                     ctrl.create);
router.put('/:id',                      roleGuard(['admin']),                     ctrl.update);

export default router;
