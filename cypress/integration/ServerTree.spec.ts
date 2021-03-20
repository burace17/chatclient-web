/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Server } from "mock-socket";

describe("Server Tree", () => {
    let mockServer: Server = undefined;

    beforeEach(() => {
        let welcomePacket;
        cy.fixture("serverData").then(packet => {
            welcomePacket = packet;
        });

        mockServer?.close();
        mockServer = new Server("ws://0.0.0.0:1337");
        mockServer.on("connection", sock => {
            sock.send(JSON.stringify(welcomePacket));
        });
        mockServer.start();

        cy.mockSockets();
        cy.visit("/").then(() => cy.login("ws://0.0.0.0:1337", "test", "test"));
    });

    it("sets the active channel", () => {
        // Click #testing
        cy.get(":nth-child(2) > .react-contextmenu-wrapper > .channel-button").click();
        cy.get(".channel-name").should("contain.text", "#testing");
        cy.get(".user-list").should("contain.text", "testuser");
        cy.get(".user-list").should("not.contain.text", "otheruser");
        cy.get(".entrybox").should("be.enabled");

        // Click #general
        cy.get(":nth-child(1) > .react-contextmenu-wrapper > .channel-button").click();
        cy.get(".channel-name").should("contain.text", "#general");
        cy.get(".user-list").should("contain.text", "testuser");
        cy.get(".user-list").should("contain.text", "otheruser");
        cy.get(".entrybox").should("be.enabled");
    });

    it("allows leaving servers", () => {
        cy.get("[data-cy=test]").rightclick();
        cy.get(".react-contextmenu--visible > :nth-child(3)").click();
        cy.get("[data-cy=test]").should("not.exist");
        cy.get(".entrybox").should("be.disabled");
    });

    it("allows modifying server properties", () => {
        // this will change the server address to something invalid and make sure we disconnected.
        cy.get("[data-cy=test]").rightclick();
        cy.get(".react-contextmenu--visible > :nth-child(4)").click();
        cy.get(":nth-child(1) > .textbox").clear();
        cy.get(":nth-child(1) > .textbox").type("e{enter}");
        cy.get("[data-cy=test]").should("not.exist");
        cy.get(".entrybox").should("be.disabled");

        // now change it back to a valid address
        cy.get("[data-cy=\"wss://e:1337\"]").rightclick();
        cy.get(".react-contextmenu--visible > :nth-child(4)").click();
        cy.get(":nth-child(1) > .textbox").clear();
        cy.get(":nth-child(1) > .textbox").type("0.0.0.0{enter}");
        cy.get("[data-cy=test]").should("exist");
        cy.get(".entrybox").should("be.enabled");
    });

    it("allows reconnecting to the same server", () => {
        cy.get("[data-cy=test]").rightclick();
        cy.get(".react-contextmenu--visible > :nth-child(2)").click();
        cy.get("[data-cy=test]").should("exist");
        cy.get(".entrybox").should("be.enabled");
    });

    it("toggles its visibility when clicking the burger button", () => {
        cy.get("[data-cy=test]").should("be.visible");
        cy.get("[data-cy=toggle-server-list]").click();
        cy.get("[data-cy=test]").should("not.be.visible");
        cy.get("[data-cy=toggle-server-list]").click();
        cy.get("[data-cy=test]").should("be.visible");
    });

    it("allows selecting servers", () => {
        cy.get("[data-cy=test]").click();
        cy.get(".entrybox").should("be.enabled");
        cy.get(":nth-child(2) > .react-contextmenu-wrapper > .channel-button").click();
        cy.get(".entrybox").should("be.enabled");
    });
});