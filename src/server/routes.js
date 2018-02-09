import { Router } from 'express';

import * as mainController from './controllers/main.controller';
import * as paymentController from './controllers/payment.controller';

const router = Router();

router.get('/robots.txt', mainController.robots);
router.get('/', mainController.index);

// Payment Code routes
router.get('/payment-code', paymentController.index);
router.post('/payment-code', paymentController.validatePaymentCode);

export default router;
