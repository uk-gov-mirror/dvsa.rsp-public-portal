import PaymentService from './../services/payment.service';
import PenaltyService from './../services/penalty.service';
import CpmsService from './../services/cpms.service';
import config from './../config';
import logger from './../utils/logger';
import PenaltyGroupService from '../services/penaltyGroup.service';

const paymentService = new PaymentService(config.paymentServiceUrl);
const penaltyService = new PenaltyService(config.penaltyServiceUrl);
const penaltyGroupService = new PenaltyGroupService(config.penaltyServiceUrl);
const cpmsService = new CpmsService(config.cpmsServiceUrl);

const getPenaltyOrGroupDetails = (req) => {
  const paymentCode = req.params.payment_code;
  if (paymentCode) {
    return paymentCode.length === 16 ?
      penaltyService.getByPaymentCode(paymentCode)
      : penaltyGroupService.getByPenaltyGroupPaymentCode(paymentCode);
  }
  return penaltyService.getById(req.params.penalty_id);
};

const redirectForSinglePenalty = (req, res, penaltyDetails) => {
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
};

const redirectForPenaltyGroup = (req, res, penaltyGroupDetails, penaltyGroupType) => {
  const redirectUrl = `https://${req.get('host')}${config.urlRoot}/payment-code/${penaltyGroupDetails.paymentCode}/receipt`;
  const penaltyOverviewsForType = penaltyGroupDetails.penaltyDetails
    .find(grouping => grouping.type === penaltyGroupType).penalties;
  const amountForType = penaltyOverviewsForType.reduce((total, pen) => total + pen.amount, 0);

  return cpmsService.createGroupCardPaymentTransaction(
    amountForType,
    penaltyGroupDetails.penaltyGroupDetails.registrationNumber,
    penaltyGroupType,
    penaltyOverviewsForType,
    redirectUrl,
  ).then(response => res.redirect(response.data.gateway_url))
    .catch((error) => {
      logger.error(error);
      res.redirect(`${config.urlRoot}/payment-code/${penaltyGroupDetails.paymentCode}`);
    });
};

export const redirectToPaymentPage = async (req, res) => {
  let entityForCode;
  try {
    entityForCode = await getPenaltyOrGroupDetails(req);

    if (entityForCode.status === 'PAID' || entityForCode.paymentStatus === 'PAID') {
      const url = `${config.urlRoot}/payment-code/${entityForCode.paymentCode}`;
      return res.redirect(url);
    }

    if (entityForCode.isPenaltyGroup) {
      const penaltyGroupType = req.params.type;
      return redirectForPenaltyGroup(req, res, entityForCode, penaltyGroupType);
    }

    return redirectForSinglePenalty(req, res, entityForCode);
  } catch (error) {
    logger.error(error);
    return res.redirect(`${config.urlRoot}/?invalidPaymentCode`);
  }
};

export const confirmPayment = async (req, res) => {
  const receiptReference = req.query.receipt_reference;
  let penaltyDetails;

  try {
    penaltyDetails = await getPenaltyOrGroupDetails(req);
    cpmsService.confirmPayment(receiptReference, penaltyDetails.type).then((response) => {
      if (response.data.code === 801) {
        // Payment successful
        const details = {
          PaymentCode: penaltyDetails.paymentCode,
          PenaltyStatus: 'PAID',
          PenaltyType: penaltyDetails.type,
          PenaltyReference: penaltyDetails.reference,
          PaymentDetail: {
            PaymentMethod: 'CARD',
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
