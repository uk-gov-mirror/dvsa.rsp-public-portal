import { describe, it, afterEach } from 'mocha';
import sinon from 'sinon';
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import PenaltyGroupService from '../../src/server/services/penaltyGroup.service';
import SignedHttpClient from '../../src/server/utils/httpclient';
import MockedBackendAPI from '../utils/mockedBackendAPI';
import penalties from '../data/penalties';
import penaltyGroups from '../data/penaltyGroups';

use(chaiAsPromised);

const httpClient = new SignedHttpClient('');

describe('Penalty Group Service', () => {
  const mockedBackendAPI = new MockedBackendAPI(penalties, penaltyGroups);

  let mockedHttpClient;
  let penaltyGroupService;

  afterEach(() => {
    mockedHttpClient.restore();
    penaltyGroupService = undefined;
  });

  describe('Retrieves a penalty group by payment code', () => {
    it('Should retrieve the correct penalty group [WHEN] a valid multiple penalty payment code is provided', async () => {
      // Arrange
      const multiplePenaltyPaymentCode = 'f31r82ismx';

      mockedHttpClient = sinon.stub(httpClient, 'get').callsFake(code => mockedBackendAPI.getPenaltyGroupByPaymentCode(code));
      penaltyGroupService = new PenaltyGroupService();
      penaltyGroupService.httpClient = mockedHttpClient.rootObj;

      // Act
      const result = await penaltyGroupService.getByPenaltyGroupPaymentCode(multiplePenaltyPaymentCode);

      // Assert
      expect(result.paymentCode).to.equal(multiplePenaltyPaymentCode);
      sinon.assert.calledWith(mockedHttpClient, 'penaltyGroup/f31r82ismx');
    });

    it('Should return a rejected promise [WHEN] an invalid payment code is provided', () => {
      // Arrange
      const invalidPaymentCode = 'abc12345678';

      mockedHttpClient = sinon.stub(httpClient, 'get').callsFake(code => mockedBackendAPI.getPenaltyByPaymentCode(code));
      penaltyGroupService = new PenaltyGroupService();
      penaltyGroupService.httpClient = mockedHttpClient.rootObj;

      // Act
      const result = penaltyGroupService.getByPenaltyGroupPaymentCode(invalidPaymentCode);

      // Assert
      return expect(result).to.be.rejected;
    });
  });
});
