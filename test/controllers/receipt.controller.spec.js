import sinon from 'sinon';

import PenaltyGroupService from '../../src/server/services/penaltyGroup.service';
import { multiPaymentReceipt, singlePaymentReceipt } from '../../src/server/controllers/receipt.controller';
import PaymentService from '../../src/server/services/payment.service';
import PenaltyService from '../../src/server/services/penalty.service';

function singlePaymentOkResponse(penaltySvcResp, paymentResp) {
  return {
    date: '11/12/2018',
    location: 'Ainley Top (M62 J24 - NW of Huddersfield)',
    paymentCode: '9e956edae3c4b5fe',
    paymentDetails: {
      Payments: {
        FPN: {
          FormattedDate: '11/12/2018',
          FormattedTime: '11:35am',
          PaymentStatus: 'PAID',
          ...paymentResp.payment.PaymentDetail,
        },
      },
    },
    paymentStatus: 'PAID',
    paymentType: 'FPN',
    penaltyDetails: [{
      penalties: [{
        ...penaltySvcResp,
      }],
      type: 'FPN',
    }],
    registrationNumber: 'TESTER7',
  };
}

describe('multiPaymentReceipt', () => {
  let penaltyGroupSvc;
  let paymentSvc;

  const request = { params: { payment_code: 'abcdefghij1', type: 'FPN' } };
  let redirectSpy;
  let renderSpy;
  let response;
  const penaltyGroupSvcResp = {
    isPenaltyGroup: true,
    penaltyDetails: [{
      penalties: [{
        location: 'Mobile site name',
      }],
    }],
  };

  const groupPaymentResp = {
    ID: 'abcdefghij1',
    Payments: {
      IM: {
        PaymentRef: 'RJF12345',
        AuthCode: '1234TBD',
        PaymentAmount: '80',
        PaymentDate: 1519300376,
        PaymentStatus: 'PAID',
      },
    },
  };
  beforeEach(() => {
    penaltyGroupSvc = sinon.stub(PenaltyGroupService.prototype, 'getByPenaltyGroupPaymentCode');
    penaltyGroupSvc
      .withArgs('abcdefghij1')
      .resolves(penaltyGroupSvcResp);
    paymentSvc = sinon.stub(PaymentService.prototype, 'getGroupPayment');
    paymentSvc
      .withArgs('abcdefghij1')
      .resolves({ data: groupPaymentResp });
    redirectSpy = sinon.spy();
    renderSpy = sinon.spy();
    response = { redirect: redirectSpy, render: renderSpy };
  });
  afterEach(() => {
    PenaltyGroupService.prototype.getByPenaltyGroupPaymentCode.restore();
    PaymentService.prototype.getGroupPayment.restore();
    redirectSpy.resetHistory();
    renderSpy.resetHistory();
  });

  describe('when PenaltyGroupService and PaymentService both return data for payment code', () => {
    it('should render the penalty group into the receipt view with payment details', async () => {
      await multiPaymentReceipt(request, response);
      sinon.assert.calledWith(renderSpy, 'payment/multiPaymentReceipt', {
        paymentType: 'FPN',
        paymentDetails: {
          ID: 'abcdefghij1',
          Payments: {
            IM: {
              PaymentRef: 'RJF12345',
              AuthCode: '1234TBD',
              PaymentAmount: '80',
              PaymentDate: 1519300376,
              FormattedDate: '22/02/2018',
              FormattedTime: '11:52am',
              PaymentStatus: 'PAID',
            },
          },
        },
        ...penaltyGroupSvcResp,
        location: 'Mobile site name',
      });
    });
  });

  describe('when payment type parameter is invalid', () => {
    it('should redirect to the invalid payment code page', async () => {
      const badRequest = { params: { payment_code: 'abcdefghij1', type: 'BAD' } };
      await multiPaymentReceipt(badRequest, response);
      sinon.assert.calledWith(redirectSpy, '/?invalidPaymentCode');
    });
  });

  describe('when PenaltyGroupService rejects on fetching by payment code', () => {
    beforeEach(() => {
      penaltyGroupSvc
        .withArgs('abcdefghij1')
        .rejects();
    });
    it('should redirect to the invalid payment code page', async () => {
      await multiPaymentReceipt(request, response);
      sinon.assert.calledWith(redirectSpy, '/?invalidPaymentCode');
    });
  });

  describe('when PaymentService rejects on fetching by payment code', () => {
    beforeEach(() => {
      paymentSvc
        .withArgs('abcdefghij1')
        .rejects();
    });
    it('should redirect to the invalid payment code page', async () => {
      await multiPaymentReceipt(request, response);
      sinon.assert.calledWith(redirectSpy, '/?invalidPaymentCode');
    });
  });
});

describe('singlePaymentReceipt', () => {
  let penaltySvc;
  let paymentSvc;

  const request = { params: { payment_code: '9e956edae3c4b5fe', type: 'FPN' } };
  let redirectSpy;
  let renderSpy;
  let response;
  const penaltySvcResp = {
    complete: true,
    reference: '122116376455',
    enabled: true,
    paymentCode: '9e956edae3c4b5fe',
    issueDate: '11/12/2018',
    vehicleReg: 'TESTER7',
    formattedReference: '122116376455',
    location: 'Ainley Top (M62 J24 - NW of Huddersfield)',
    amount: '100',
    status: 'PAID',
    type: 'FPN',
    typeDescription: 'Fixed Penalty Notice',
    paymentDate: '11/12/2018',
    paymentAuthCode: '112471',
    paymentRef: 'RJF12345',
  };
  const paymentResp = {
    payment: {
      ID: '122116376455_FPN',
      PenaltyStatus: 'PAID',
      PaymentDetail: {
        PaymentMethod: 'CARD',
        PaymentRef: 'RJF12345',
        AuthCode: '1234TBD',
        PaymentAmount: '100',
        PaymentDate: 1544528141,
      },
    },
  };

  beforeEach(() => {
    penaltySvc = sinon.stub(PenaltyService.prototype, 'getByPaymentCode');
    penaltySvc.withArgs('9e956edae3c4b5fe').resolves(penaltySvcResp);

    paymentSvc = sinon.stub(PaymentService.prototype, 'getPayment');
    paymentSvc.withArgs('122116376455_FPN').resolves({ data: paymentResp });

    redirectSpy = sinon.spy();
    renderSpy = sinon.spy();
    response = { redirect: redirectSpy, render: renderSpy };
  });

  afterEach(() => {
    PenaltyService.prototype.getByPaymentCode.restore();
    PaymentService.prototype.getPayment.restore();
    redirectSpy.resetHistory();
    renderSpy.resetHistory();
  });

  describe('when PenaltyService and PaymentService both return data for payment code', () => {
    it('should render the penalty into the receipt view with the payment details', async () => {
      await singlePaymentReceipt(request, response);
      const expectedResponse = singlePaymentOkResponse(penaltySvcResp, paymentResp);
      sinon.assert.calledWith(renderSpy, 'payment/multiPaymentReceipt', expectedResponse);
    });
  });

  describe('when PenaltyService rejects on fetching by payment code', () => {
    beforeEach(() => {
      penaltySvc
        .withArgs('9e956edae3c4b5fe')
        .rejects();
    });
    it('should redirect to the invalid payment code page', async () => {
      await singlePaymentReceipt(request, response);
      sinon.assert.calledWith(redirectSpy, '/?invalidPaymentCode');
    });
  });

  describe('when PaymentService rejects on fetching by payment reference', () => {
    beforeEach(() => {
      paymentSvc
        .withArgs('122116376455_FPN')
        .rejects();
    });
    it('should redirect to the invalid payment code page', async () => {
      await singlePaymentReceipt(request, response);
      sinon.assert.calledWith(redirectSpy, '/?invalidPaymentCode');
    });
  });
});
