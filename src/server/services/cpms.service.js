import SignedHttpClient from './../utils/httpclient';

export default class PaymentService {
  constructor(serviceUrl) {
    this.httpClient = new SignedHttpClient(serviceUrl);
  }

  createCardPaymentTransaction(paymentCode, reg, penaltyRef, penaltyType, amount, redirectUrl) {
    return this.httpClient.post('cardPayment/', {
      payment_code: paymentCode,
      penalty_reference: penaltyRef,
      penalty_type: penaltyType,
      penalty_amount: amount,
      redirect_url: redirectUrl,
      vehicle_reg: reg,
    }, 3);
  }

  createGroupCardPaymentTransaction(penGrpId, amount, vehicleReg, type, penOverviews, redirectUrl) {
    return this.httpClient.post('groupPayment/', {
      PenaltyGroupId: penGrpId,
      TotalAmount: amount,
      VehicleRegistration: vehicleReg,
      PenaltyType: type,
      RedirectUrl: redirectUrl,
      Penalties: penOverviews.map(PaymentService.sanitisePenaltyForCpmsGroupCall),
    }, 3);
  }

  static sanitisePenaltyForCpmsGroupCall(penalty) {
    return {
      PenaltyReference: penalty.formattedReference,
      PenaltyAmount: penalty.amount,
      VehicleRegistration: penalty.vehicleReg,
    };
  }

  confirmPayment(receiptReference, penaltyType) {
    return this.httpClient.post('confirm/', {
      receipt_reference: receiptReference,
      penalty_type: penaltyType,
    }, 3);
  }

  makePayment(details) {
    return this.httpClient.post('payments/', details);
  }
}
