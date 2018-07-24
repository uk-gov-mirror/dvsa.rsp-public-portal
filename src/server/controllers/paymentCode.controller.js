import { validationResult } from 'express-validator/check';
import paymentCodeValidation from './../validation/paymentCode';
import PenaltyService from '../services/penalty.service';
import PenaltyGroupService from '../services/penaltyGroup.service';
import config from '../config';
import logger from './../utils/logger';

const penaltyService = new PenaltyService(config.penaltyServiceUrl);
const penaltyGroupService = new PenaltyGroupService(config.penaltyServiceUrl);

// Index Route
export const index = (req, res) => {
  if (Object.keys(req.query).some(param => param === 'invalidPaymentCode')) {
    return res.render('payment/index', { invalidPaymentCode: true });
  }
  return res.render('payment/index');
};

// Removes all non-alphanumeric characters and converts to lowercase
export const normalizePaymentcode = (req, res, next) => {
  if (req.body.payment_code) {
    req.body.payment_code = req.body.payment_code.replace(/\W|_/g, '').toLowerCase();
  }
  next();
};

export const validatePaymentCode = [
  normalizePaymentcode,
  paymentCodeValidation,
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error(errors.mapped());

      const viewData = {
        invalidPaymentCode: true,
      };
      res.render('payment/index', viewData);
    } else {
      res.redirect(`payment-code/${req.body.payment_code}`);
    }
  },
];

export const getPaymentDetails = [
  paymentCodeValidation,
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error(errors.mapped());
      res.redirect('../payment-code?invalidPaymentCode');
    } else {
      const paymentCode = req.params.payment_code;
      const { service, getMethod, template } = paymentCode.length === 16 ? {
        service: penaltyService,
        getMethod: 'getByPaymentCode',
        template: 'paymentDetails',
      } : {
        service: penaltyGroupService,
        getMethod: 'getByPenaltyGroupPaymentCode',
        template: 'multiPaymentInfo',
      };
      service[getMethod](paymentCode).then((data) => {
        res.render(`payment/${template}`, data);
      }).catch((error) => {
        logger.error(error);
        res.redirect('../payment-code?invalidPaymentCode');
      });
    }
  },
];

export const getMultiPenaltyPaymentSummary = [
  (req, res) => {
    const paymentCode = req.params.payment_code;
    const { type } = req.params;
    penaltyGroupService.getPaymentsByCodeAndType(paymentCode, type).then((penaltyDetails) => {
      res.render('payment/multiPaymentSummary', { penaltyDetails });
    }).catch((error) => {
      logger.error(error);
      res.redirect('../payment-code?invalidPaymentCode');
    });
  },
];
