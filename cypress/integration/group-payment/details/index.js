const unpaidPenaltyGroupId = Cypress.env('unpaidPenaltyGroup');

export default function testGroupPaymentPage() {
  it('displays help details when summary clicked', () => {
    cy.contains('Call DVSA').should('not.be.visible');
    cy.contains('If you are having difficulty making a payment').click();
    cy.contains('Call DVSA').should('be.visible');
  });

  it('displays the payment status', () => {
    cy.contains('UNPAID');
  });

  it('links to home page', () => {
    cy.contains('Home').click();
    cy.url().should('equal', Cypress.config().baseUrl);
  });

  it('links to payment code search', () => {
    cy.contains('Payment code').click();
    cy.url().should('equal', `${Cypress.config().baseUrl}payment-code`);
  });

  it('links to penalty details', () => {
    cy.contains('Penalty details').click();
    cy.url().should('equal', `${Cypress.config().baseUrl}payment-code/${unpaidPenaltyGroupId}`);
  });

  it('displays the third party application warning', () => {
    cy.contains('Payments will be processed by a third party application');
  });
}
