/* eslint-disable no-use-before-define */
import PaymentService from './../services/payment.service';
import PenaltyService from './../services/penalty.service';
import CpmsService from './../services/cpms.service';
import config from './../config';
import logger from './../utils/logger';
import PenaltyGroupService from '../services/penaltyGroup.service';

const paymentService = new PaymentService(config.paymentServiceUrl());
const penaltyService = new PenaltyService(config.penaltyServiceUrl());
const penaltyGroupService = new PenaltyGroupService(config.penaltyServiceUrl());
const cpmsService = new CpmsService(config.cpmsServiceUrl());

const getPenaltyOrGroupDetails = (req) => {
  const paymentCode = req.params.payment_code;
  return paymentCode.length === 16 ?
    penaltyService.getByPaymentCode(paymentCode)
    : penaltyGroupService.getByPenaltyGroupPaymentCode(paymentCode);
};

const redirectForSinglePenalty = async (req, res, penaltyDetails, redirectHost) => {
  const { paymentCode } = penaltyDetails;
  const redirectUrl = `${redirectHost}/payment-code/${paymentCode}/confirmPayment`;

  try {
    const response = await cpmsService.createCardPaymentTransaction(
      paymentCode,
      penaltyDetails.vehicleReg,
      penaltyDetails.formattedReference,
      penaltyDetails.type,
      penaltyDetails.amount,
      redirectUrl,
      penaltyDetails.reference,
    );
    logger.error(JSON.stringify(response.data));
    const receiptReference = response.data.receipt_reference;
    await penaltyService.updateWithReceipt(
      `${penaltyDetails.reference}_${penaltyDetails.type}`,
      receiptReference, penaltyDetails.PendingTransactions,
    );
    return res.redirect(response.data.gateway_url);
  } catch (err) {
    const errorLog = {
      message: 'Error in redirectForSinglePenalty',
      responseData: err.response.data,
      status: err.response.status,
    };
    logger.error(errorLog);
    return res.redirect(`${config.urlRoot()}/payment-code/${penaltyDetails.paymentCode}`);
  }
};

const redirectForPenaltyGroup = async (
  req,
  res,
  groupResponse,
  penaltyType,
  redirectHost,
) => {
  const errRedirect = `${config.urlRoot()}/payment-code/${groupResponse.paymentCode}`;
  try {
    const confirmedPayment = await confirmPendingTransactions(
      groupResponse,
      penaltyType,
      groupResponse.PendingTransactions,
    );
    if (confirmedPayment) {
      return res.redirect(errRedirect);
    }
  } catch (error) {
    return res.redirect(errRedirect);
  }

  const redirectUrl = `${redirectHost}/payment-code/${groupResponse.paymentCode}/${penaltyType}/confirmGroupPayment`;
  const penaltyOverviewsForType = groupResponse.penaltyDetails
    .find(grouping => grouping.type === penaltyType).penalties;
  const amountForType = penaltyOverviewsForType.reduce((total, pen) => total + pen.amount, 0);

  try {
    const response = await cpmsService.createGroupCardPaymentTransaction(
      groupResponse.paymentCode,
      amountForType,
      groupResponse.penaltyGroupDetails.registrationNumber,
      penaltyType,
      penaltyOverviewsForType,
      redirectUrl,
    );
    const receiptReference = response.data.receipt_reference;

    await penaltyService.updatePenaltyGroupWithReceipt(
      groupResponse.paymentCode,
      receiptReference,
      groupResponse.PendingTransactions,
    );
    return res.redirect(response.data.gateway_url);
  } catch (error) {
    const errorLog = {
      message: 'Error in redirectForPenaltyGroup',
      responseData: error.response.data,
      status: error.response.status,
    };
    logger.error(errorLog);
    return res.redirect(errRedirect);
  }
};

export const redirectToPaymentPage = async (req, res) => {
  console.log('redirecting to payment page');
  let entityForCode;
  try {
    entityForCode = await getPenaltyOrGroupDetails(req);
    const { paymentCode } = entityForCode;

    if (entityForCode.status === 'PAID' || entityForCode.paymentStatus === 'PAID') {
      const url = `${config.urlRoot()}/payment-code/${paymentCode}`;
      return res.redirect(url);
    }

    if (entityForCode.isPenaltyGroup) {
      const penaltyGroupType = req.params.type;
      const redirectUrl = config.redirectUrl();
      return redirectForPenaltyGroup(req, res, entityForCode, penaltyGroupType, redirectUrl);
    }

    try {
      const confirmedPayment = await confirmPendingTransactions(
        entityForCode,
        entityForCode.type,
        entityForCode.PendingTransactions,
      );
      if (confirmedPayment) {
        const url = `${config.urlRoot()}/payment-code/${paymentCode}`;
        return res.redirect(url);
      }
    } catch (error) {
      const url = `${config.urlRoot()}/payment-code/${paymentCode}`;
      return res.redirect(url);
    }

    return redirectForSinglePenalty(req, res, entityForCode, config.redirectUrl());
  } catch (error) {
    logger.error(error);
    return res.redirect(`${config.urlRoot()}/?invalidPaymentCode`);
  }
};

/**
 * Check if any pending transactions are complete. If they are, add payment record.
 * @param {*} penalty
 * @param {string} penaltyType
 * @param {string[]} receiptReferences
 * @returns {Promise<boolean>} The payment status
 */
const confirmPendingTransactions = async (penalty, penaltyType, receiptReferences) => {
  if (!receiptReferences) {
    return false;
  }

  try {
    const transactions = (await cpmsService.confirmPendingTransactions(
      penaltyType,
      receiptReferences,
    )).data;

    console.log(transactions);

    const paymentRequests = transactions.paid.map(transaction => (
      recordPayment(penalty, transaction, penaltyType)
    ));

    await Promise.all(paymentRequests);

    const cancelledReceipts = transactions.cancelled.map(transaction => transaction.receiptRef);
    if (cancelledReceipts.length !== 0) {
      console.log(`Removing ${cancelledReceipts.length} receipts`);
      if (penalty.isPenaltyGroup()) {
        await penaltyService.removeGroupCancelledTransactions(cancelledReceipts);
      } else {
        await penaltyService.removedCancelledTransactions(cancelledReceipts);
      }
    }

    return transactions.paid.length !== 0;
  } catch (err) {
    console.error(err);
    return false;
  }
};

const recordPayment = async (penalty, transaction, penaltyType) => {
  if (penalty.isPenaltyGroup) {
    const groupPaymentPayload = buildGroupPaymentPayload(
      penalty.paymentCode,
      transaction.receiptRef,
      penaltyType,
      penalty,
      transaction.authCode,
    );
    await paymentService.recordGroupPayment(groupPaymentPayload);
  } else {
    const paymentPayload = buildPaymentPayload(
      penalty,
      transaction.receiptRef,
      transaction.authCode,
    );
    await paymentService.makePayment(paymentPayload);
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
        const details = buildPaymentPayload(
          penaltyDetails,
          response.data.receipt_reference,
          response.data.auth_code,
        );
        await paymentService.makePayment(details)
          .then(() => res.redirect(`${config.urlRoot()}/payment-code/${penaltyDetails.paymentCode}/receipt`))
          .catch((error) => {
            logger.error(error);
            res.redirect(`${config.urlRoot()}/payment-code/${penaltyDetails.paymentCode}`);
          });
      } else {
        logger.warn(response.data);
        res.render('payment/failedPayment', { paymentCode });
      }
    }).catch((error) => {
      logger.error(error);
      res.render('payment/failedPayment', { paymentCode });
    });
  } catch (error) {
    logger.error(error);
    res.redirect(`${config.urlRoot()}/?invalidPaymentCode`);
  }
};

export const confirmGroupPayment = async (req, res) => {
  console.log('confirming group payment');
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
        confirmResp.data.auth_code,
      );
      await paymentService.recordGroupPayment(payload);
      res.redirect(`${config.urlRoot()}/payment-code/${paymentCode}/${type}/receipt`);
    } else if (cpmsCode === 807) {
      res.redirect(`${config.urlRoot()}/payment-code/${paymentCode}`);
    } else {
      res.render('payment/failedPayment', { paymentCode });
    }
  } catch (error) {
    logger.error(error);
    res.render('payment/failedPayment', { paymentCode });
  }
};

const buildPaymentPayload = (penaltyDetails, receiptReference, authCode) => ({
  PaymentCode: penaltyDetails.paymentCode,
  PenaltyStatus: 'PAID',
  PenaltyType: penaltyDetails.type,
  PenaltyReference: penaltyDetails.reference,
  PaymentDetail: {
    PaymentMethod: 'CARD',
    PaymentRef: receiptReference,
    AuthCode: authCode,
    PaymentAmount: penaltyDetails.amount,
    PaymentDate: Math.round((new Date()).getTime() / 1000),
  },
});

function buildGroupPaymentPayload(paymentCode, receiptReference, type, penaltyGroup, authCode) {
  const amountForType = penaltyGroup.penaltyGroupDetails.splitAmounts
    .find(a => a.type === type).amount;
  return {
    PaymentCode: paymentCode,
    PenaltyType: type,
    PaymentDetail: {
      PaymentMethod: 'CARD',
      PaymentRef: receiptReference,
      AuthCode: authCode,
      PaymentAmount: amountForType,
      PaymentDate: Math.floor(Date.now() / 1000),
    },
    PenaltyIds: penaltyGroup.penaltyDetails
      .find(penaltiesOfType => penaltiesOfType.type === type).penalties
      .map(penalties => `${penalties.reference}_${type}`),
  };
}
