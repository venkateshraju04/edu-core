import { Router } from 'express';
import * as ctrl from '../controllers/attendance.controller';
import { jwtAuth } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';

const router = Router();

router.use(jwtAuth);

router.get('/student/:studentId',           roleGuard(['teacher', 'hod', 'principal']), ctrl.getStudentSummary);
router.get('/class/:classId/date/:date',    roleGuard(['teacher']),                     ctrl.getClassByDate);
router.post('/bulk',                        roleGuard(['teacher']),                     ctrl.bulkMark);

export default router;
