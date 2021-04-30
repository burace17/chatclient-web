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
Cypress.Commands.add("login", (addr: string, username: string, password: string) => {
    cy.window().then(window => {
        (window as any).ccTestAppInstance.onServerAdded(addr, username, password, false, false);
    });
});

Cypress.Commands.add("stubNotifications", () => {
    cy.on("window:load", window => {
        cy.stub(window, "Notification").as("Notification").callsFake(() => {});
    });
});

// https://github.com/quasarframework/quasar/issues/2233
// apparently this error is safe to ignore.
const resizeObserverLoopErrRe = /^[^(ResizeObserver loop limit exceeded)]/;
Cypress.on("uncaught:exception", (err) => {
    /* returning false here prevents Cypress from failing the test */
    if (resizeObserverLoopErrRe.test(err.message)) {
        return false;
    }
});

export { };
declare global {
    namespace Cypress {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        interface Chainable<Subject> {
            mockSockets(): void;
            login(addr: string, username: string, password: string);
            stubNotifications();
        }
    }
}