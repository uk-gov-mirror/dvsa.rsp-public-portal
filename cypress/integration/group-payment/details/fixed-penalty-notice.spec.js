import testGroupPaymentPage from '.';

const unpaidPenaltyGroupId = Cypress.env('unpaidPenaltyGroup');

context('pay fixed penalty notice', () => {
  beforeEach(() => {
    cy.visit(`payment-code/${unpaidPenaltyGroupId}/FPN/details`);
  });

  it('displays the title', () => {
    cy.contains('Pay fixed penalties');
  });

  testGroupPaymentPage();
});
