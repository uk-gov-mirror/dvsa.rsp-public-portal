import PaymentService from './../services/payment.service';
import PenaltyService from './../services/penalty.service';
import CpmsService from './../services/cpms.service';
import config from './../config';
import logger from './../utils/logger';

const paymentService = new PaymentService(config.paymentServiceUrl);
const penaltyService = new PenaltyService(config.penaltyServiceUrl);
const cpmsService = new CpmsService(config.cpmsServiceUrl);

const getPenaltyDetails = (req) => {
  if (req.params.payment_code) {
    return penaltyService.getByPaymentCode(req.params.payment_code);
  }
  return penaltyService.getById(req.params.penalty_id);
};

export const redirectToPaymentPage = async (req, res) => {
  let penaltyDetails;

  try {
    penaltyDetails = await getPenaltyDetails(req);

    if (penaltyDetails.status === 'PAID') {
      return res.redirect(`${config.urlRoot}/payment-code/${penaltyDetails.paymentCode}`);
    }

    const redirectUrl = `https://${req.get('host')}${config.urlRoot}/payment-code/${penaltyDetails.paymentCode}/confirmPayment`;

    return cpmsService.createCardPaymentTransaction(
      penaltyDetails.vehicleReg,
      penaltyDetails.reference,
      penaltyDetails.type,
      penaltyDetails.amount,
      redirectUrl,
    ).then(response => res.redirect(response.data.gateway_url))
      .catch((error) => {
        logger.error(error);
        res.redirect(`${config.urlRoot}/payment-code/${penaltyDetails.paymentCode}`);
      });
  } catch (error) {
    logger.error(error);
    return res.redirect(`${config.urlRoot}/?invalidPaymentCode`);
  }
};

export const confirmPayment = async (req, res) => {
  const receiptReference = req.query.receipt_reference;
  let penaltyDetails;

  try {
    penaltyDetails = await getPenaltyDetails(req);
    cpmsService.confirmPayment(receiptReference, penaltyDetails.type).then((response) => {
      if (response.data.code === 801) {
        // Payment successful
        const details = {
          PenaltyStatus: 'PAID',
          PenaltyType: penaltyDetails.type,
          PenaltyReference: penaltyDetails.reference,
          PaymentDetail: {
            PaymentRef: response.data.receipt_reference,
            AuthCode: response.data.auth_code,
            PaymentAmount: penaltyDetails.amount,
            PaymentDate: Math.round((new Date()).getTime() / 1000),
          },
        };
        paymentService.makePayment(details).then(() => res.redirect(`${config.urlRoot}/payment-code/${penaltyDetails.paymentCode}`))
          .catch(() => res.redirect(`${config.urlRoot}/payment-code/${penaltyDetails.paymentCode}`));
      } else {
        logger.warn(response.data);
        res.render('payment/failedPayment');
      }
    }).catch((error) => {
      logger.error(error);
      res.render('payment/failedPayment');
    });
  } catch (error) {
    logger.error(error);
    res.redirect(`${config.urlRoot}/?invalidPaymentCode`);
  }
};
