import { expect } from 'chai';
import { after, afterEach, beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';
import CpmsService from '../../src/server/services/cpms.service';
import SignedHttpClient from '../../src/server/utils/httpclient';

describe('Payment Service', () => {
  describe('groupCardPaymentTransaction', () => {
    let mockHttpClient;
    let cpmsService;

    beforeEach(() => {
      mockHttpClient = sinon.stub(SignedHttpClient.prototype, 'post');
      cpmsService = new CpmsService('testurl');
    });

    afterEach(() => {
      mockHttpClient.resetHistory();
    });

    after(() => {
      SignedHttpClient.prototype.post.restore();
    });

    it('returns a promise from POSTing payment details to the cardPaymentGroup endpoint', () => {
      const httpPromise = Promise.resolve('resp');
      mockHttpClient
        .returns(httpPromise);

      const penaltyOverviews = [
        {
          complete: true,
          reference: '820500000901',
          paymentCode: '1111111111111111',
          issueDate: '11/10/2016',
          vehicleReg: '11ABC',
          formattedReference: '820500000901',
          location: 'BLACKWALL TUNNEL A, PAVILLION WAY, METROPOLITAN',
          amount: 100,
          status: 'UNPAID',
          type: 'FPN',
          typeDescription: 'Fixed Penalty Notice',
        },
        {
          complete: true,
          reference: '820500000902',
          paymentCode: '2222222222222222',
          issueDate: '11/10/2016',
          vehicleReg: '22XYZ',
          formattedReference: '820500000902',
          location: 'BLACKWALL TUNNEL A, PAVILLION WAY, METROPOLITAN',
          amount: 50,
          status: 'UNPAID',
          type: 'FPN',
          typeDescription: 'Fixed Penalty Notice',
        },
      ];

      const returned = cpmsService.createGroupCardPaymentTransaction('11111111111', 150, '11ABC, 22XYZ', 'FPN', penaltyOverviews, 'http://redirect');

      sinon.assert.calledWith(mockHttpClient, 'groupCardPayment/', {
        PenaltyGroupId: '11111111111',
        TotalAmount: 150,
        VehicleRegistration: '11ABC, 22XYZ',
        PenaltyType: 'FPN',
        RedirectUrl: 'http://redirect',
        Penalties: [
          {
            PenaltyReference: '820500000901',
            PenaltyAmount: 100,
            VehicleRegistration: '11ABC',
          },
          {
            PenaltyReference: '820500000902',
            PenaltyAmount: 50,
            VehicleRegistration: '22XYZ',
          },
        ],
      });
      expect(returned).to.be.equal(httpPromise);
    });
  });
});
