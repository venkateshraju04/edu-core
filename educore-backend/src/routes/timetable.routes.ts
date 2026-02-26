import { Router } from 'express';
import * as ctrl from '../controllers/timetable.controller';
import { jwtAuth } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';

const router = Router();

router.use(jwtAuth);

router.get('/class/:classId',  roleGuard(['admin', 'principal', 'hod', 'teacher']), ctrl.getByClass);
router.post('/',               roleGuard(['admin']),                                 ctrl.create);
router.put('/:id',             roleGuard(['admin']),                                 ctrl.update);
router.delete('/:id',          roleGuard(['admin']),                                 ctrl.remove);

export default router;
