/* eslint-disable no-use-before-define */
import PaymentService from './../services/payment.service';
import PenaltyService from './../services/penalty.service';
import CpmsService from './../services/cpms.service';
import config from './../config';
import { logInfo, logError } from './../utils/logger';
import PenaltyGroupService from '../services/penaltyGroup.service';

const paymentService = new PaymentService(config.paymentServiceUrl());
const penaltyService = new PenaltyService(config.penaltyServiceUrl());
const penaltyGroupService = new PenaltyGroupService(config.penaltyServiceUrl());
const cpmsService = new CpmsService(config.cpmsServiceUrl());

const getPenaltyOrGroupDetails = (req) => {
  const paymentCode = req.params.payment_code;
  if (paymentCode) {
    return paymentCode.length === 16 ?
      penaltyService.getByPaymentCode(paymentCode)
      : penaltyGroupService.getByPenaltyGroupPaymentCode(paymentCode);
  }
  return penaltyService.getById(req.params.penalty_id);
};

const redirectForSinglePenalty = (req, res, penaltyDetails, redirectHost) => {
  const { paymentCode } = penaltyDetails;
  const redirectUrl = `${redirectHost}/payment-code/${paymentCode}/confirmPayment`;
  return cpmsService.createCardPaymentTransaction(
    paymentCode,
    penaltyDetails.vehicleReg,
    penaltyDetails.formattedReference,
    penaltyDetails.type,
    penaltyDetails.amount,
    redirectUrl,
    penaltyDetails.reference,
  ).then((response) => {
    logInfo('RedirectFromSinglePenaltyResponse', response.data);
    res.redirect(response.data.gateway_url);
  }).catch(() => {
    res.redirect(`${config.urlRoot()}/payment-code/${penaltyDetails.paymentCode}`);
  });
};

const redirectForPenaltyGroup = (req, res, penaltyGroupDetails, penaltyType, redirectHost) => {
  const redirectUrl = `${redirectHost}/payment-code/${penaltyGroupDetails.paymentCode}/${penaltyType}/confirmGroupPayment`;
  const penaltyOverviewsForType = penaltyGroupDetails.penaltyDetails
    .find(grouping => grouping.type === penaltyType).penalties;
  const amountForType = penaltyOverviewsForType.reduce((total, pen) => total + pen.amount, 0);

  return cpmsService.createGroupCardPaymentTransaction(
    penaltyGroupDetails.paymentCode,
    amountForType,
    penaltyGroupDetails.penaltyGroupDetails.registrationNumber,
    penaltyType,
    penaltyOverviewsForType,
    redirectUrl,
  ).then(response => res.redirect(response.data.gateway_url))
    .catch(() => {
      res.redirect(`${config.urlRoot()}/payment-code/${penaltyGroupDetails.paymentCode}`);
    });
};

// Mock payment status
const lastPaymentAttemptTime = new Date();

export const redirectToPaymentPageUnlessPending = async (req, res) => {
  try {
    const entityForCode = await getPenaltyOrGroupDetails(req);
    if (entityForCode.status !== 'PAID' && isPaymentPending(new Date())) {
      return res.redirect(`${config.urlRoot()}/payment-code/${entityForCode.paymentCode}/pending`);
    }
    return redirectToPaymentPage(req, res);
  } catch (err) {
    return res.redirect(`${config.urlRoot()}/?invalidPaymentCode`);
  }
};

/** 30 minutes */
const PAYMENT_PENDING_TIMEOUT = 1000 * 60 * 30;

function isPaymentPending(paymentTime) {
  return (paymentTime - lastPaymentAttemptTime) < PAYMENT_PENDING_TIMEOUT;
}

export const redirectToPaymentPage = async (req, res) => {
  console.log('redirecting to payment page');
  let entityForCode;
  try {
    entityForCode = await getPenaltyOrGroupDetails(req);

    if (entityForCode.status === 'PAID' || entityForCode.paymentStatus === 'PAID') {
      const url = `${config.urlRoot()}/payment-code/${entityForCode.paymentCode}`;
      return res.redirect(url);
    }

    if (entityForCode.isPenaltyGroup) {
      const penaltyGroupType = req.params.type;
      const redirectUrl = config.redirectUrl();
      return redirectForPenaltyGroup(req, res, entityForCode, penaltyGroupType, redirectUrl);
    }

    return redirectForSinglePenalty(req, res, entityForCode, config.redirectUrl());
  } catch (err) {
    return res.redirect(`${config.urlRoot()}/?invalidPaymentCode`);
  }
};

export const confirmPayment = async (req, res) => {
  console.log('confirming payment');
  const receiptReference = req.query.receipt_reference;
  const paymentCode = req.params.payment_code;
  let penaltyDetails;

  try {
    penaltyDetails = await getPenaltyOrGroupDetails(req);

    await cpmsService.confirmPayment(
      receiptReference,
      penaltyDetails.type,
    ).then(async (response) => {
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
        await paymentService.makePayment(details)
          .then(() => res.redirect(`${config.urlRoot()}/payment-code/${penaltyDetails.paymentCode}/receipt`))
          .catch(() => {
            res.redirect(`${config.urlRoot()}/payment-code/${penaltyDetails.paymentCode}`);
          });
      } else {
        if (response.data.code === 807) {
          logInfo('UserCancelledPayment', {
            statusCode: 807,
            receiptReference,
            paymentCode,
          });
        } else {
          logError('ConfirmPaymentNon801', response.data);
        }
        res.render('payment/failedPayment', { paymentCode });
      }
    }).catch(() => {
      res.render('payment/failedPayment', { paymentCode });
    });
  } catch (error) {
    res.redirect(`${config.urlRoot()}/?invalidPaymentCode`);
  }
};

export const confirmGroupPayment = async (req, res) => {
  const paymentCode = req.params.payment_code;
  try {
    const receiptReference = req.query.receipt_reference;
    const { type } = req.params;
    const confirmPromise = cpmsService.confirmPayment(receiptReference, type);
    const groupDetailsPromise = getPenaltyOrGroupDetails(req);
    const [groupDetails, confirmResp] = await Promise.all([groupDetailsPromise, confirmPromise]);

    const cpmsCode = confirmResp.data.code;

    if (cpmsCode === 801) {
      const payload = buildGroupPaymentPayload(
        paymentCode,
        receiptReference,
        type,
        groupDetails,
        confirmResp,
      );
      await paymentService.recordGroupPayment(payload);
      res.redirect(`${config.urlRoot()}/payment-code/${paymentCode}/${type}/receipt`);
    } else if (cpmsCode === 807) {
      logInfo('UserCancelledPayment', {
        statusCode: 807,
        receiptReference,
        paymentCode,
      });
      res.redirect(`${config.urlRoot()}/payment-code/${paymentCode}`);
    } else {
      logError('ConfirmPaymentNon801Or807', confirmResp.data);
      res.render('payment/failedPayment', { paymentCode });
    }
  } catch (error) {
    res.render('payment/failedPayment', { paymentCode });
  }
};

function buildGroupPaymentPayload(paymentCode, receiptReference, type, penaltyGroup, confirmResp) {
  const amountForType = penaltyGroup.penaltyGroupDetails.splitAmounts
    .find(a => a.type === type).amount;
  return {
    PaymentCode: paymentCode,
    PenaltyType: type,
    PaymentDetail: {
      PaymentMethod: 'CARD',
      PaymentRef: receiptReference,
      AuthCode: confirmResp.data.auth_code,
      PaymentAmount: amountForType,
      PaymentDate: Math.floor(Date.now() / 1000),
    },
    PenaltyIds: penaltyGroup.penaltyDetails
      .find(penaltiesOfType => penaltiesOfType.type === type).penalties
      .map(penalties => `${penalties.reference}_${type}`),
  };
}
