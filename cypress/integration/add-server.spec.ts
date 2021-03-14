/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Server } from "mock-socket";
describe("Add Server", () => {
    let mockServer: Server = undefined;
    beforeEach(() => {
        mockServer?.close();

        mockServer = new Server("ws://0.0.0.0:1337");
        mockServer.on("connection", sock => {
            sock.on("message", (message: string) => {
                const packet = {
                    "cmd": "WELCOME",
                    "name": "test",
                    "channels": [],
                    "nickname": "",
                    "viewing": []
                };
                sock.send(JSON.stringify(packet));
            });
        });
        mockServer.start();

        cy.mockSockets();
    });

    it("allows logging as an existing user", () => {
        cy.visit("https://localhost:3000");
        cy.get(".button").click();
        cy.get(":nth-child(1) > .textbox").type("0.0.0.0");
        cy.get(".server-form > :nth-child(2) > .textbox").type("test");
        cy.get(":nth-child(3) > .textbox").type("mypassword{enter}");
        cy.get(".server-name").should("contain", "test");
    });
    it("allows registering as a new user", () => {
        cy.visit("https://localhost:3000");
        cy.get(".button").click();
        cy.get(":nth-child(1) > .textbox").type("0.0.0.0");
        cy.get(".server-form > :nth-child(2) > .textbox").type("newuser123");
        cy.get(":nth-child(3) > .textbox").type("my password");
        cy.get(":nth-child(5) > :nth-child(2) > input").click();
        cy.get("[type=\"submit\"]").click();
        cy.get(".server-name").should("contain", "test");
    });
    it("can dismiss with ESC", () => {
        cy.visit("https://localhost:3000");
        cy.get(".button").click();
        cy.get(".server-form").should("exist");
        cy.get("form").type("{esc}");
        cy.get(".server-form").should("not.exist");
    });
    it("can dismiss with close button", () => {
        cy.visit("https://localhost:3000");
        cy.get(".button").click();
        cy.get(".server-form").should("exist");
        cy.get(".close").click();
        cy.get(".server-form").should("not.exist");
    });
    it("can dismiss with cancel button", () => {
        cy.visit("https://localhost:3000");
        cy.get(".button").click();
        cy.get(":nth-child(1) > .textbox").type("0.0.0.0");
        cy.get(".server-form > :nth-child(2) > .textbox").type("newuser123");
        cy.get(":nth-child(3) > .textbox").type("my password");
        cy.get("[type=\"button\"]").click();
        cy.get(".server-form").should("not.exist");
        cy.get(".server-name").should("not.exist");
    });
});