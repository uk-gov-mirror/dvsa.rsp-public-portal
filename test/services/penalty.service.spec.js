import { describe, it, afterEach } from 'mocha';
import sinon from 'sinon';
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import PenaltyService from '../../src/server/services/penalty.service';
import SignedHttpClient from '../../src/server/utils/httpclient';
import MockedBackendAPI from '../utils/mockedBackendAPI';
import penalties from '../data/penalties';
import penaltyGroups from '../data/penaltyGroups';

use(chaiAsPromised);

const httpClient = new SignedHttpClient('');

describe('Penalty Service', () => {
  const mockedBackendAPI = new MockedBackendAPI(penalties, penaltyGroups);

  let mockedHttpClient;
  let penaltyService;

  afterEach(() => {
    mockedHttpClient.restore();
    penaltyService = undefined;
  });

  describe('Retrieves a penalty by payment code', () => {
    it('Should retrieve the correct penalty [WHEN] a valid single penalty payment code is provided', async () => {
      // Arrange
      const singlePenaltyPaymentCode = '1111111111111111';

      mockedHttpClient = sinon.stub(httpClient, 'get').callsFake(code => mockedBackendAPI.getPenaltyByPaymentCode(code));
      penaltyService = new PenaltyService();
      penaltyService.httpClient = mockedHttpClient.rootObj;

      // Act
      const result = await penaltyService.getByPaymentCode(singlePenaltyPaymentCode);

      // Assert
      expect(result.paymentCode).to.equal(singlePenaltyPaymentCode);
      sinon.assert.calledWith(mockedHttpClient, 'documents/tokens/1111111111111111');
    });

    it('Should return a rejected promise [WHEN] an invalid payment code is provided', () => {
      // Arrange
      const invalidPaymentCode = 'zzxzxzxasdqawsdaszxcwqesd$"£%$£$"%';

      mockedHttpClient = sinon.stub(httpClient, 'get').callsFake(code => mockedBackendAPI.getPenaltyByPaymentCode(code));
      penaltyService = new PenaltyService();
      penaltyService.httpClient = mockedHttpClient.rootObj;

      // Act
      const result = penaltyService.getByPaymentCode(invalidPaymentCode);

      // Assert
      return expect(result).to.be.rejected;
    });
  });
});
