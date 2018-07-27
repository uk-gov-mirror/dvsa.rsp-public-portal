import { describe, it, after, afterEach, before } from 'mocha';
import sinon from 'sinon';

import * as PaymentController from '../../src/server/controllers/payment.controller';
import PenaltyService from '../../src/server/services/penalty.service';
import PenaltyGroupService from '../../src/server/services/penaltyGroup.service';
import CpmsService from '../../src/server/services/cpms.service';

function requestForPaymentCode(paymentCode) {
  return {
    params: {
      payment_code: paymentCode,
      type: 'FPN',
    },
    get: (key) => {
      const gettables = {
        host: 'localhost',
      };
      return gettables[key];
    },
  };
}

describe('Payment Controller', () => {
  describe('redirects to payment page for penalty groups', () => {
    let mockPenaltySvc;
    let mockPenaltyGroupSvc;
    let mockCpmsSvc;
    let redirectSpy;
    let responseHandle;

    before(() => {
      mockPenaltySvc = sinon.stub(PenaltyService.prototype, 'getByPaymentCode');
      mockPenaltyGroupSvc = sinon.stub(PenaltyGroupService.prototype, 'getByPenaltyGroupPaymentCode');
      mockCpmsSvc = sinon.stub(CpmsService.prototype, 'createCardPaymentTransaction');
      redirectSpy = sinon.spy({ redirect: () => {} }, 'redirect');
      responseHandle = { redirect: redirectSpy };
    });

    afterEach(() => {
      mockPenaltySvc.reset();
      mockPenaltyGroupSvc.reset();
      mockCpmsSvc.reset();
      redirectSpy.reset();
    });

    after(() => {
      PenaltyService.prototype.getByPaymentCode.restore();
      PenaltyGroupService.prototype.getByPenaltyGroupPaymentCode.restore();
      CpmsService.prototype.createCardPaymentTransaction.restore();
    });

    describe('for single penalty payment codes', () => {
      it('should redirect to the payment code URL when status is paid', async () => {
        mockPenaltySvc.withArgs('1111111111111111')
          .resolves({ status: 'PAID', paymentCode: '1111111111111111' });

        await PaymentController.redirectToPaymentPage({ params: { payment_code: '1111111111111111' } }, responseHandle);

        sinon.assert.calledWith(redirectSpy, '/payment-code/1111111111111111');
      });

      it('should redirect to the CPMS gateway URL returned when CPMS Service creates a transaction', async () => {
        mockPenaltySvc
          .withArgs('1111111111111111')
          .resolves({
            status: 'UNPAID',
            paymentCode: '1111111111111111',
            vehicleReg: '11ABC',
            reference: '123',
            type: 'FPN',
            amount: 100,
          });
        mockCpmsSvc
          .withArgs('11ABC', '123', 'FPN', 100, 'https://localhost/payment-code/1111111111111111/confirmPayment')
          .resolves({ data: { gateway_url: 'http://cpms.gateway' } });

        await PaymentController.redirectToPaymentPage(requestForPaymentCode('1111111111111111'), responseHandle);

        sinon.assert.calledWith(redirectSpy, 'http://cpms.gateway');
      });
    });

    describe('for multiple penalty payment codes', () => {
      it('should redirect to the CPMS gateway URL returned when CPMS Service creates a transaction', async () => {
        mockPenaltyGroupSvc
          .withArgs('46uu8efys1o')
          .resolves({
            isPenaltyGroup: true,
            penaltyGroupDetails: {
              registrationNumber: '11ABC',
              location: 'some location',
              date: '01/01/1970',
              amount: 230,
              // splitAmounts,
            },
            paymentCode: '46uu8efys1o',
            penaltyDetails: null,
            paymentStatus: 'UNPAID',
            nextPayment: {},
          });
        mockCpmsSvc
          .withArgs('11ABC', '46uu8efys1o', 'FPN', 230, 'https://localhost/payment-code/46uu8efys1o/confirmPayment')
          .resolves({ data: { gateway_url: 'http://cpms.gateway' } });

        await PaymentController.redirectToPaymentPage(requestForPaymentCode('46uu8efys1o'), responseHandle);

        sinon.assert.calledWith(redirectSpy, 'http://cpms.gateway');
      });
    });
  });
});
