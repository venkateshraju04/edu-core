import { Router } from 'express';
import * as ctrl from '../controllers/fees.controller';
import { jwtAuth } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';

const router = Router();

router.use(jwtAuth);

router.get('/summary',               roleGuard(['admin', 'principal']), ctrl.summary);
router.get('/',                      roleGuard(['admin']),              ctrl.list);
router.get('/student/:studentId',    roleGuard(['admin']),              ctrl.listByStudent);
router.get('/:id/receipt',           roleGuard(['admin']),              ctrl.getReceipt);
router.post('/',                     roleGuard(['admin']),              ctrl.create);
router.put('/:id',                   roleGuard(['admin']),              ctrl.update);

export default router;
