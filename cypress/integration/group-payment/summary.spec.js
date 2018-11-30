const unpaidPenaltyGroupId = Cypress.env('unpaidPenaltyGroup');
const paidPenaltyGroupId = Cypress.env('paidPenaltyGroup');

context('group payment summary page', () => {
  context('unpaid penalty group', () => {
    beforeEach(() => {
      cy.visit(`payment-code/${unpaidPenaltyGroupId}`);
    });

    it('displays the title', () => {
      cy.contains('Summary of DVSA roadside fines');
    });

    it('links to details page', () => {
      cy.contains('Make a payment');
    });

    it('displays correct payment status', () => {
      cy.contains('UNPAID');
    });

    it('displays warning', () => {
      cy.contains('you could be taken to court');
    });

    it('displays help details when summary clicked', () => {
      cy.contains('Call DVSA customer service').should('not.be.visible');
      cy.contains('If these details are wrong or you need help').click();
      cy.contains('Call DVSA customer service').should('be.visible');
    });

    it('links to call charges', () => {
      cy.contains('Find out about call charges').should('have.attr', 'href', 'https://www.gov.uk/call-charges');
    });
  });

  context('paid penalty group', () => {
    beforeEach(() => {
      cy.visit(`payment-code/${paidPenaltyGroupId}`);
    });

    it('displays correct payment status', async () => {
      const res = await cy.contains('PAID');

      // Ensure text is PAID and not UNPAID
      expect(res.text()).to.equal('PAID');
    });

    it('links to receipt', () => {
      cy.contains('Receipt').click();
      cy.url().should('include', '/receipt');
    });
  });
});
