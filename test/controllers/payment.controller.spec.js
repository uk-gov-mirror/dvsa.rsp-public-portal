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
    let mockCpmsSvcSingle;
    let mockCpmsSvcGroup;
    let redirectSpy;
    let responseHandle;

    before(() => {
      mockPenaltySvc = sinon.stub(PenaltyService.prototype, 'getByPaymentCode');
      mockPenaltyGroupSvc = sinon.stub(PenaltyGroupService.prototype, 'getByPenaltyGroupPaymentCode');
      mockCpmsSvcSingle = sinon.stub(CpmsService.prototype, 'createCardPaymentTransaction');
      mockCpmsSvcGroup = sinon.stub(CpmsService.prototype, 'createGroupCardPaymentTransaction');
      redirectSpy = sinon.spy({ redirect: () => {} }, 'redirect');
      responseHandle = { redirect: redirectSpy };
    });

    after(() => {
      PenaltyService.prototype.getByPaymentCode.restore();
      PenaltyGroupService.prototype.getByPenaltyGroupPaymentCode.restore();
      CpmsService.prototype.createCardPaymentTransaction.restore();
      CpmsService.prototype.createGroupCardPaymentTransaction.restore();
    });

    afterEach(() => {
      mockPenaltySvc.resetHistory();
      mockPenaltyGroupSvc.resetHistory();
      mockCpmsSvcSingle.resetHistory();
      mockCpmsSvcGroup.resetHistory();
      redirectSpy.resetHistory();
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
        mockCpmsSvcSingle
          .withArgs('11ABC', '123', 'FPN', 100, 'https://localhost/payment-code/1111111111111111/confirmPayment')
          .resolves({ data: { gateway_url: 'http://cpms.gateway' } });

        await PaymentController.redirectToPaymentPage(requestForPaymentCode('1111111111111111'), responseHandle);

        sinon.assert.calledWith(redirectSpy, 'http://cpms.gateway');
      });
    });

    describe('for multiple penalty payment codes', () => {
      it('should redirect to the CPMS gateway URL returned when CPMS Service creates a transaction', async () => {
        const fakePenaltyDetails = [
          {
            type: 'FPN',
            penalties: [
              {
                vehicleRegistration: '11ABC',
                amount: 100,
                type: 'FPN',
              },
              {
                vehicleRegistration: '11ABC',
                amount: 50,
                type: 'FPN',
              },
            ],
          },
          {
            type: 'IM',
            penalties: [
              {
                vehicleRegistration: '11ABC',
                amount: 80,
                type: 'IM',
              },
            ],
          },
        ];
        mockPenaltyGroupSvc
          .withArgs('46uu8efys1o')
          .resolves({
            isPenaltyGroup: true,
            penaltyGroupDetails: {
              registrationNumber: '11ABC',
              location: 'some location',
              date: '01/01/1970',
              amount: 230,
              splitAmounts: null,
            },
            paymentCode: '46uu8efys1o',
            penaltyDetails: fakePenaltyDetails,
            paymentStatus: 'UNPAID',
            nextPayment: null,
          });
        mockCpmsSvcGroup
          .withArgs(150, '11ABC', 'FPN', fakePenaltyDetails[0].penalties, 'https://localhost/payment-code/46uu8efys1o/confirmPayment')
          .resolves({ data: { gateway_url: 'http://cpms.gateway' } });

        await PaymentController.redirectToPaymentPage(requestForPaymentCode('46uu8efys1o'), responseHandle);

        sinon.assert.calledWith(redirectSpy, 'http://cpms.gateway');
      });
    });
  });
});
