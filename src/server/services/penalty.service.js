import { isEmpty, has } from 'lodash';
import * as moment from 'moment';
import SignedHttpClient from './../utils/httpclient';

export default class PenaltyService {
  constructor(serviceUrl) {
    this.httpClient = new SignedHttpClient(serviceUrl);
  }

  static getPenaltyTypeDescription(penaltyType) {
    switch (penaltyType.toUpperCase()) {
      case 'CDN':
        return 'Court Deposit Notice';
      case 'FPN':
        return 'Fixed Penalty Notice';
      case 'IM':
        return 'Immobilisation';
      default:
        return 'Unknown';
    }
  }

  static parsePenalty(data) {
    const penaltyId = data.ID;
    const reference = penaltyId.split('_').shift();
    const rawPenalty = data.Value;
    const complete = has(rawPenalty, 'vehicleDetails') && !isEmpty(rawPenalty);
    const penaltyDetails = {
      complete,
      reference,
      enabled: data.Enabled,
      paymentCode: rawPenalty.paymentToken,
      issueDate: complete && moment.unix(rawPenalty.dateTime).format('DD/MM/YYYY'),
      vehicleReg: complete && rawPenalty.vehicleDetails.regNo,
      formattedReference: rawPenalty.referenceNo,
      location: complete && rawPenalty.placeWhereIssued,
      amount: rawPenalty.penaltyAmount,
      status: rawPenalty.paymentStatus,
      type: rawPenalty.penaltyType,
      typeDescription: PenaltyService.getPenaltyTypeDescription(rawPenalty.penaltyType),
      paymentDate: rawPenalty.paymentDate ? moment.unix(rawPenalty.paymentDate).format('DD/MM/YYYY') : undefined,
      paymentAuthCode: rawPenalty.paymentAuthCode,
      paymentRef: rawPenalty.paymentRef,
      PendingTransactions: data.PendingTransactions,
    };
    return penaltyDetails;
  }

  getByPaymentCode(paymentCode) {
    const promise = new Promise((resolve, reject) => {
      this.httpClient.get(`documents/tokens/${paymentCode}`).then((response) => {
        if (isEmpty(response.data)) {
          reject(new Error('Payment code not found'));
        }
        resolve(PenaltyService.parsePenalty(response.data));
      }).catch((error) => {
        reject(new Error(error));
      });
    });
    return promise;
  }

  /**
   * Invoke storeCpmsReceiptReference
   * @param {string} penaltyReference The ID of the penalty document
   * @param {string} receiptReference The receipt reference for a payment
   */
  updateWithReceipt(penaltyReference, receiptReference, pendingTransactions) {
    const body = {
      penaltyReference,
      receiptReference,
      pendingTransactions,
    };
    return this.httpClient.put(`documents/${penaltyReference}/updateWithReceipt/`, body, 3);
  }

  updatePenaltyGroupWithReceipt(penaltyGroupId, receiptReference, penaltyType) {
    const body = {
      receiptReference,
      penaltyType,
    };

    return this.httpClient.put(`penaltyGroup/${penaltyGroupId}/updateWithReceipt/`, body, 3);
  }

  removedCancelledTransactions(penaltyId, receiptReferences) {
    const body = {
      receiptReferences,
    };

    return this.httpClient.put(`documents/${penaltyId}/removeReceipts`, body, 3);
  }

  removeGroupCancelledTransactions(penaltyGroupId, receiptReferences) {
    const body = {
      receiptReferences,
    };

    return this.httpClient.put(`penaltyGroup/${penaltyGroupId}/removeReceipts`, body, 3);
  }
}
