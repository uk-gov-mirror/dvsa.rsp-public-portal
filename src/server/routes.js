import { Router } from 'express';

import * as mainController from './controllers/main.controller';
import * as paymentCodeController from './controllers/paymentCode.controller';
import * as paymentController from './controllers/payment.controller';
import * as cpmsController from './controllers/cpms.controller';

const router = Router();

router.get('/robots.txt', mainController.robots);

// Landing Page
router.get('/', mainController.index);

// Payment Code
router.get('/payment-code', paymentCodeController.index);
router.post('/payment-code', paymentCodeController.validatePaymentCode);
router.get('/payment-code/:payment_code', paymentCodeController.getPaymentDetails);
router.post('/payment-code/:payment_code/payment', paymentController.redirectToPaymentPage);
router.get('/payment-code/:payment_code/confirmPayment', paymentController.confirmPayment);

router.get('/cpms-step-1', cpmsController.step1);
router.get('/cpms-step-2', cpmsController.step2);
router.get('/cpms-step-3', cpmsController.step3);
router.post('/cpms-step-3', cpmsController.makePayment);

export default router;
