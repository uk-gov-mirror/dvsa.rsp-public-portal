import SignedHttpClient from './../utils/httpclient';

export default class PaymentService {
  constructor(serviceUrl) {
    this.httpClient = new SignedHttpClient(serviceUrl);
  }

  createCardPaymentTransaction(vehicleReg, penaltyReference, penaltyType, amount, redirectUrl) {
    return this.httpClient.post('cardPayment/', JSON.stringify({
      penalty_reference: penaltyReference,
      penalty_type: penaltyType,
      penalty_amount: amount,
      redirect_url: redirectUrl,
      vehicle_reg: vehicleReg,
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
