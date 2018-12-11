import SignedHttpClient from './../utils/httpclient';

export default class PaymentService {
  constructor(serviceUrl) {
    this.httpClient = new SignedHttpClient(serviceUrl);
  }

  makePayment(details) {
    return this.httpClient.post('payments/', details);
  }

  async getPayment(paymentCode) {
    return this.httpClient.get(`payments/${paymentCode}`)
  }

  async recordGroupPayment(details) {
    return this.httpClient.post('groupPayments/', details);
  }

  async getGroupPayment(paymentCode) {
    return this.httpClient.get(`groupPayments/${paymentCode}`);
  }
}
