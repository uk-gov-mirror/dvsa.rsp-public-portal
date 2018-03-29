/* eslint-disable */
import PaymentService from './../services/payment.service';
import PenaltyService from './../services/penalty.service';
import CpmsService from './../services/cpms.service';
import config from './../config';

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
    //const redirectUrl = `https://${req.get('host')}${config.urlRoot}/payment-code/${penaltyDetails.paymentCode}/confirmPayment`;
    const redirectUrl = `https://8pp5fzn8ih.execute-api.eu-west-1.amazonaws.com/dev/payment-code/${penaltyDetails.paymentCode}/confirmPayment`;
    console.log(redirectUrl);
    cpmsService.createCardPaymentTransaction(
      penaltyDetails.reference,
      penaltyDetails.type,
      penaltyDetails.amount,
      redirectUrl,
    ).then((response) => {
      console.log(response);
      res.redirect(response.data.gateway_url);
    }).catch(error => console.log(error));
  } catch (error) {
    return res.redirect(`${config.urlRoot}/?invalidPaymentCode`);
  }
};

export const confirmPayment = async (req, res) => {
  const receiptReference = req.query.receipt_reference;
  console.log(req.params);
  let penaltyDetails;
  try {
    penaltyDetails = await getPenaltyDetails(req);
    cpmsService.confirmPayment(receiptReference, penaltyDetails.type).then((response) => {
      console.log('confirmPayment response');
      console.log(response.data);
      if(response.data.code === 801) {
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
        paymentService.makePayment(details).then(() => {
          res.redirect(`${config.urlRoot}/payment-code/${penaltyDetails.paymentCode}`);
        }).catch(error => console.log(error));
      } else {
        res.redirect(`${config.urlRoot}/payment-code/${penaltyDetails.paymentCode}`);
      }
    }).catch(error => console.log(error));
  } catch (error) {
    console.log(error);
    res.redirect(`${config.urlRoot}/?invalidPaymentCode`);
  }
};

export const makePayment = (req, res) => {
  const details = {
    PenaltyStatus: 'PAID',
    PenaltyType: req.body.type,
    PenaltyReference: req.body.reference,
    PaymentDetail: {
      PaymentRef: '12345678',
      AuthCode: '1234TBD',
      PaymentAmount: req.body.amount,
      PaymentDate: Math.round((new Date()).getTime() / 1000),
    },
  };

  paymentService.makePayment(details).then(() => {
    res.redirect(`${config.urlRoot}/payment-code/${req.body.paymentCode}`);
  }).catch(() => res.redirect('back')); // TODO: Add appropriate error page and/or logging
};

