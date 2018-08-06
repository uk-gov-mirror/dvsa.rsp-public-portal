import { describe, it, after, afterEach, before } from 'mocha';
import sinon from 'sinon';

import * as PaymentController from '../../src/server/controllers/payment.controller';
import PenaltyService from '../../src/server/services/penalty.service';
import PenaltyGroupService from '../../src/server/services/penaltyGroup.service';
import CpmsService from '../../src/server/services/cpms.service';
import PaymentService from '../../src/server/services/payment.service';

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
          .withArgs('46uu8efys1o', 150, '11ABC', 'FPN', fakePenaltyDetails[0].penalties, 'https://localhost/payment-code/46uu8efys1o/FPN/receipt')
          .resolves({ data: { gateway_url: 'http://cpms.gateway' } });

        await PaymentController.redirectToPaymentPage(requestForPaymentCode('46uu8efys1o'), responseHandle);

        sinon.assert.calledWith(redirectSpy, 'http://cpms.gateway');
      });
    });
  });

  describe('confirmGroupPayment', () => {
    let mockCpmsSvc;
    let mockPenaltyGrpSvc;
    let mockPaymentSvc;
    let redirectSpy;
    let renderSpy;
    let resp;
    const req = {
      params: {
        payment_code: 'codenotlength16',
        type: 'FPN',
      },
    };
    const penaltyGroupDetails = {
      paymentCode: 'codenotlength16',
      penaltyGroupDetails: {
        splitAmounts: [
          {
            type: 'FPN',
            amount: 150,
            status: 'PAID',
          },
        ],
      },
    };
    const expectedPaymentPayload = {
      PaymentCode: 'codenotlength16',
      PenaltyType: 'FPN',
      PaymentDetail: {
        PaymentMethod: 'CARD',
        PaymentRef: 'codenotlength16_FPN',
        AuthCode: '111',
        PaymentAmount: '150',
        PaymentDate: sinon.match.number,
      },
    };

    before(() => {
      mockPenaltyGrpSvc = sinon.stub(PenaltyGroupService.prototype, 'getByPenaltyGroupPaymentCode');
      mockCpmsSvc = sinon.stub(CpmsService.prototype, 'confirmPayment');
      mockPaymentSvc = sinon.stub(PaymentService.prototype, 'recordGroupPayment');

      redirectSpy = sinon.spy();
      renderSpy = sinon.spy();
      resp = { redirect: redirectSpy, render: renderSpy };
    });

    beforeEach(() => {
      mockPenaltyGrpSvc
        .withArgs('codenotlength16')
        .resolves(penaltyGroupDetails);

      mockCpmsSvc
        .withArgs('codenotlength16_FPN', 'FPN')
        .resolves({ data: { code: 801, auth_code: '111' } });
      mockPaymentSvc
        .withArgs(expectedPaymentPayload)
        .resolves(true);
    });

    afterEach(() => {
      mockPenaltyGrpSvc.resetHistory();
      mockCpmsSvc.resetHistory();
      mockPaymentSvc.resetHistory();
      redirectSpy.resetHistory();
      renderSpy.resetHistory();
    });

    after(() => {
      CpmsService.prototype.confirmPayment.restore();
      PenaltyGroupService.prototype.getByPenaltyGroupPaymentCode.restore();
      PaymentService.prototype.recordGroupPayment.restore();
    });

    context('when CPMS confirms payment with response code 801', () => {
      it('should redirect to the receipt page', async () => {
        await PaymentController.confirmGroupPayment(req, resp);
        sinon.assert.calledWith(mockCpmsSvc, 'codenotlength16_FPN', 'FPN');
        sinon.assert.calledWith(mockPaymentSvc, expectedPaymentPayload);
        sinon.assert.calledWith(redirectSpy, '/payment-code/codenotlength16/receipt');
      });
    });

    context('when the payment cannot be confirmed', () => {
      beforeEach(() => {
        mockCpmsSvc.reset();
        mockCpmsSvc
          .rejects('call failed');
      });

      it('should redirect to the payment declined page', async () => {
        await PaymentController.confirmGroupPayment(req, resp);
        sinon.assert.called(mockCpmsSvc);
        sinon.assert.calledWith(renderSpy, 'payment/failedPayment');
      });
    });

    context('when CPMS say the payment status is different to 801', () => {
      beforeEach(() => {
        mockCpmsSvc.reset();
        mockCpmsSvc
          .resolves({ data: { code: 999 } });
      });
      it('should redirect to the payment declined page', async () => {
        await PaymentController.confirmGroupPayment(req, resp);
        sinon.assert.called(mockCpmsSvc);
        sinon.assert.calledWith(renderSpy, 'payment/failedPayment');
      });
    });

    context('when recording group payment record fails', () => {
      beforeEach(() => {
        mockPaymentSvc.reset();
        mockPaymentSvc.rejects('payment service call failed');
      });
      it('should redirect to the payment declined page', async () => {
        await PaymentController.confirmGroupPayment(req, resp);
        sinon.assert.called(mockCpmsSvc);
        sinon.assert.called(mockPaymentSvc);
        sinon.assert.calledWith(renderSpy, 'payment/failedPayment');
      });
    });
  });
});
