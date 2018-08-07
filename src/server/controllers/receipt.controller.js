import config from '../config';
import PenaltyGroupService from '../services/penaltyGroup.service';

const penaltyGroupService = new PenaltyGroupService(config.penaltyServiceUrl);

export default async (req, res) => {
  const paymentCode = req.params.payment_code;
  const penaltyGroup = await penaltyGroupService.getByPenaltyGroupPaymentCode(paymentCode);
  console.log(JSON.stringify(penaltyGroup));
  const resp = {
    paymentType: req.params.type,
    ...penaltyGroup,
  };
  res.render('payment/multiPaymentReceipt', resp);
};
