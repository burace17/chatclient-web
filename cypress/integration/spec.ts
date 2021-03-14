describe("Add Server", () => {
    it("allows logging as an existing user", () => {
        cy.visit("https://localhost:3000");
        cy.get(".button").click();
        cy.get(":nth-child(1) > .textbox").type("localhost");
        cy.get(".server-form > :nth-child(2) > .textbox").type("test");
        cy.get(":nth-child(3) > .textbox").type("mypassword{enter}");
        cy.get(".server-name").should("contain", "test");
    });
    it("allows registering as a new user", () => {
        cy.visit("https://localhost:3000");
        cy.get(".button").click();
        cy.get(":nth-child(1) > .textbox").type("localhost");
        cy.get(".server-form > :nth-child(2) > .textbox").type("newuser123");
        cy.get(":nth-child(3) > .textbox").type("my password");
        cy.get(":nth-child(5) > :nth-child(2) > input").click();
        cy.get("[type=\"submit\"]").click();
        cy.get(".server-name").should("contain", "test");
    });
});