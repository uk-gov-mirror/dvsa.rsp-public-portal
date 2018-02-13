import { Router } from 'express';

import * as mainController from './controllers/main.controller';
import * as paymentController from './controllers/payment.controller';
import * as cpmsController from './controllers/cpms.controller';

const router = Router();

router.get('/robots.txt', mainController.robots);
router.get('/', mainController.index);

// Payment Code routes
router.get('/payment-code', paymentController.index);
router.post('/payment-code', paymentController.validatePaymentCode);

router.get('/cpms-step-1', cpmsController.step1);
router.get('/cpms-step-2', cpmsController.step2);
router.get('/cpms-step-3', cpmsController.step3);

export default router;
