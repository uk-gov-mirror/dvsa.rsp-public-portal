import testGroupPaymentPage from './';

const unpaidPenaltyGroupId = Cypress.env('unpaidPenaltyGroup');

context('pay immobilisation fee page', () => {
  beforeEach(() => {
    cy.visit(`payment-code/${unpaidPenaltyGroupId}/IM/details`);
  });

  it('displays the title', () => {
    cy.contains('Pay immobilisation fee');
  });

  it('displays the payment button', () => {
    cy.contains('Pay immobilisation fee');
  });

  testGroupPaymentPage();
});
