import { Router } from 'express';

import * as mainController from './controllers/main.controller';
import * as paymentController from './controllers/payment.controller';

const router = Router();

router.get('/robots.txt', mainController.robots);

// Landing Page
router.get('/', mainController.index);

// Payment Code
router.get('/payment-code', paymentController.index);
router.post('/payment-code', paymentController.validatePaymentCode);
router.get('/payment-code/:payment_code', paymentController.getPaymentDetails);

export default router;
