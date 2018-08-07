import config from '../config';
import PenaltyGroupService from '../services/penaltyGroup.service';
import PaymentService from '../services/payment.service';

const penaltyGroupService = new PenaltyGroupService(config.penaltyServiceUrl);
const paymentService = new PaymentService(config.paymentServiceUrl);

export default async (req, res) => {
  const paymentCode = req.params.payment_code;
  const penaltyGroup = await penaltyGroupService.getByPenaltyGroupPaymentCode(paymentCode);
  const paymentDetails = (await paymentService.getGroupPayment(paymentCode)).data;
  const resp = {
    paymentType: req.params.type,
    paymentDetails,
    ...penaltyGroup,
  };
  res.render('payment/multiPaymentReceipt', resp);
};
