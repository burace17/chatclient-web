/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

Cypress.Commands.add("mockSockets", () => {
    cy.on("window:load", window => {
        cy.stub(window, "WebSocket").callsFake((url: string) => {
            // mock-socket doesn't support wss, so just silently switch to the non secure version
            return new WebSocket(url.replace("wss://", "ws://"));
        });
    });
});

// Hacky way of bypassing the login UI.
Cypress.Commands.add("login", () => {
    cy.window().then(window => {
        (window as any).ccTestAppInstance.onServerAdded("ws://0.0.0.0:1337", "test", "test", false, false);
    });
});

export { };
declare global {
    namespace Cypress {
        interface Chainable<Subject> {
            mockSockets(): void;
            login();
        }
    }
}