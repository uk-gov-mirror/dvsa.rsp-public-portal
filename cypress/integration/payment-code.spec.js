const INVALID_CODE_TOO_MANY_CHARS = '1234567890123456';

context('enter payment code page', () => {
  beforeEach(() => {
    cy.visit('payment-code');
  });

  it('display the title', () => {
    cy.contains('Enter payment code');
  });

  it('submits an invalid payment code', () => {
    cy.get('#payment_code').type(INVALID_CODE_TOO_MANY_CHARS);
    cy.contains('Continue').click();
    cy.url().should('include', '?invalidPaymentCode');
  });

  it('submits a valid payment code', () => {
    const paymentCode = Cypress.env('paymentCode');
    cy.get('#payment_code').type(paymentCode);
    cy.contains('Continue').click();
    cy.url().should('include', paymentCode);
  });
});
