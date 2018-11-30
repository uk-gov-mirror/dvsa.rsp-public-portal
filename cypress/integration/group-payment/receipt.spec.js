const penGroupId = Cypress.env('paidPenaltyGroup');


// function getPenaltyGroup() {
//   // TODO send a get request to get the penalty group. Then use the data
//   // from that request to check in the UI.
//   cy.request(``)
// }

context('group payment receipt page', () => {
  beforeEach(() => {
    cy.visit(`payment-code/${penGroupId}/IM/receipt`);
  });

  it('displays the title', () => {
    cy.contains('Payment complete');
  });

  it('displays the print info', () => {

  });
});
