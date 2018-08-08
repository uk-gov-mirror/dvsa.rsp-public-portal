import sinon from 'sinon';

import PenaltyGroupService from '../../src/server/services/penaltyGroup.service';
import ReceiptController from '../../src/server/controllers/receipt.controller';
import PaymentService from '../../src/server/services/payment.service';

describe('ReceiptController', () => {
  let penaltyGroupSvc;
  let paymentSvc;

  const request = { params: { payment_code: 'abcdefghij1', type: 'FPN' } };
  let redirectSpy;
  let renderSpy;
  let response;
  const penaltyGroupSvcResp = {
    isPenaltyGroup: true,
  };

  const groupPaymentResp = {
    ID: 'abcdefghij1',
    Payments: {
      IM: {
        PaymentRef: 'RJF12345',
        AuthCode: '1234TBD',
        PaymentAmount: '80',
        PaymentDate: 1519300376667,
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
      .resolves({ data: groupPaymentResp })
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

  it('should render the penalty group into the receipt view', async () => {
    await ReceiptController(request, response);
    sinon.assert.calledWith(renderSpy, 'payment/multiPaymentReceipt', {
      paymentType: 'FPN',
      paymentDetails: groupPaymentResp,
      ...penaltyGroupSvcResp
    });
  });
});