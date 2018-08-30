export default class MockedBackEndAPI {
  constructor(penalties, penaltyGroups) {
    this.penalties = penalties;
    this.penaltyGroups = penaltyGroups;
  }

  getPenaltyByPaymentCode(requestUrl) {
    const code = requestUrl.split('/').pop();
    const result = this.penalties.find(p => p.paymentToken === code);

    if (result) {
      return Promise.resolve({
        data: {
          Value: result,
          ID: `${result.referenceNo}_${result.penaltyType}`,
        },
      });
    }

    return Promise.reject(new Error('Invalid Payment Code'));
  }

  getPenaltyGroupByPaymentCode(requestUrl) {
    const code = requestUrl.split('/').pop();
    const result = this.penaltyGroups.find(pg => pg.ID === code);

    if (result) {
      return Promise.resolve({
        data: {
          ...result,
        },
      });
    }

    return Promise.reject(new Error('Invalid Payment Code'));
  }
}
