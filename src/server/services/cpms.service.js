import createHttpClient from './../utils/httpclient';

export default class PaymentService {
  constructor(serviceUrl) {
    this.httpClient = createHttpClient(serviceUrl);
  }

  createCardPaymentTransaction(penaltyReference, penaltyType, amount, redirectUrl) {
    return this.httpClient.post('cardPayment/', JSON.stringify({
      penalty_reference: penaltyReference,
      penalty_type: penaltyType,
      penalty_amount: amount,
      redirect_url: redirectUrl,
    }));
  }

  confirmPayment(receiptReference, penaltyType) {
    return this.httpClient.post('confirm/', JSON.stringify({
      receipt_reference: receiptReference,
      penalty_type: penaltyType,
    }));
  }

  makePayment(details) {
    return this.httpClient.post('payments/', details);
  }
}
