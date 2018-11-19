import { expect } from 'chai';
import setupApp from '../../app';

let app;

describe('view multiPaymentSummary', () => {
  beforeEach(async () => {
    app = await setupApp();
  });
  describe('breadcrumbs', () => {
    it('links back to summary of payments', (done) => {
      const paymentCode = 'paymentcode123';
      const paymentStatus = '';
      const penaltyDetails = '';
      const penaltyType = 'IM';
      const totalAmount = 100;

      app.render('payment/multiPaymentSummary', {
        paymentCode, paymentStatus, penaltyDetails, penaltyType, totalAmount,
      }, (err, html) => {
        if (err) {
          throw err;
        }
        expect(html).to.include(`href="/payment-code/${paymentCode}"`);
        done();
      });

    });
  });
});
