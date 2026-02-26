import { Router } from 'express';
import * as ctrl from '../controllers/marks.controller';
import { jwtAuth } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';

const router = Router();

router.use(jwtAuth);

router.get('/student/:studentId',  roleGuard(['teacher', 'hod', 'principal']), ctrl.getByStudent);
router.post('/',                   roleGuard(['teacher']),                      ctrl.create);
router.put('/:id',                 roleGuard(['teacher']),                      ctrl.update);

export default router;
