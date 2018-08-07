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
    penaltyGroupDetails: {
      registrationNumber: 'HDJSJSS',
      location: 'Abingdon (A34/41 interchange - South of Oxford)',
      date: '03/08/2018',
      amount: 88,
      splitAmounts: [
        {
          type: 'FPN',
          amount: 22,
          status: 'UNPAID'
        },
        {
          type: 'IM',
          amount: 66,
          status: 'UNPAID'
        }
      ]
    },
    paymentCode: 'abcdefghij1',
    penaltyDetails: [
      {
        type: 'FPN',
        penalties: [
          {
            complete: true,
            reference: '546354235638',
            paymentCode: '8af3dfe5d182f01f',
            issueDate: '03/08/2018',
            vehicleReg: 'HDJSJSS',
            formattedReference: '546354235638',
            location: 'Abingdon (A34/41 interchange - South of Oxford)',
            amount: 22,
            status: 'UNPAID',
            type: 'FPN',
            typeDescription: 'Fixed Penalty Notice'
          }
        ]
      },
      {
        type: 'IM',
        penalties: [
          {
            complete: true,
            reference: '0054320005464',
            paymentCode: 'f3c8d955ec4c77a0',
            issueDate: '03/08/2018',
            vehicleReg: 'HDJSJSS',
            formattedReference: '5432-0-5464-IM',
            location: 'Abingdon (A34/41 interchange - South of Oxford)',
            amount: 66,
            status: 'UNPAID',
            type: 'IM',
            typeDescription: 'immobilisation'
          }
        ]
      }
    ],
    paymentStatus: 'UNPAID',
    nextPayment: {
      PaymentCategory: 'IM',
      TotalAmount: 66,
      PaymentStatus: 'UNPAID',
      Penalties: [
        {
          Offset: 1533305346,
          inPenaltyGroup: true,
          Enabled: true,
          Origin: 'APP',
          ID: '0054320005464_IM',
          Value: {
            dateTime: 1533254400,
            siteCode: 1,
            vehicleDetails: {
              regNo: 'HDJSJSS'
            },
            referenceNo: '5432-0-5464-IM',
            nonEndorsableOffence: [],
            penaltyType: 'IM',
            paymentToken: 'f3c8d955ec4c77a0',
            inPenaltyGroup: true,
            placeWhereIssued: 'Abingdon (A34/41 interchange - South of Oxford)',
            officerName: 'roadside-payment@dvsagov.onmicrosoft.com',
            penaltyAmount: 66,
            officerID: 'jrV1yNL3QUDl8rjBIHkv9BgKhRUvTSDcKyHhrsqSQeo',
            paymentStatus: 'UNPAID'
          },
          Hash: '7506b039a72b123d121e9fba66689d87232195dc432f04eddf9c54bb4b81ed63'
        }
      ]
    }
  };

  const groupPaymentResp = {
    ID: 'abcdefghij1',
    Payments: {
      IM: {
        PaymentRef: 'RJF12345',
        AuthCode: '1234TBD',
        PaymentAmount: '80',
        PaymentDate: 1519300376667,
        PaymentStatus: "PAID",
      }
    }
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