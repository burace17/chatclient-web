/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* eslint jest/valid-expect-in-promise: 0 */

import { MockServer } from "../support/MockServer";
import { User, UserStatus, Channel } from "../../src/net/client";

describe("Channels", () => {
    let mockServer: MockServer;
    const testUser: User = {
        id: 1,
        username: "testuser",
        nickname: "testuser",
        status: UserStatus.Online
    };
    const otherUser: User = {
        id: 2,
        username: "otheruser",
        nickname: "otheruser",
        status: UserStatus.Online
    };
    const anotherUser: User = {
        id: 3,
        username: "anotheruser",
        nickname: "anotheruser",
        status: UserStatus.Online
    };

    let channels: Channel[] = [
        {
            address: "",
            id: 1,
            name: "#general",
            users: [testUser]
        }
    ];

    beforeEach(() => {
        mockServer?.stop();
        mockServer = new MockServer("ws://0.0.0.0:1337", Array.from(channels), testUser);
        mockServer.start();

        cy.mockSockets();
        cy.stubNotifications();
        cy.visit("/").then(() => cy.login("ws://0.0.0.0:1337", "testuser", "test"));
    });

    it("can be joined with /join command", () => {
        cy.get(".entrybox").type("/join #testing{enter}");
        cy.get(".channel-name").should("contain.text", "#testing");
        cy.get(".entrybox").should("be.enabled");
        cy.get("[data-cy=test]").click();
        cy.get(".entrybox").type("/join #anothertest{enter}");
        cy.get(".channel-name").should("contain.text", "#anothertest");
        cy.get(".entrybox").should("be.enabled");
    });

    it("causes a user list update on join", () => {
        // we should be in the user list and any new users joining should be too.
        cy.get(".user-list").should("contain.text", "testuser").then(() => {
            mockServer.fakeJoin(otherUser, "#general");
        });
        cy.get(":nth-child(1) > .online-user").should("contain.text", "otheruser");

        // join #testing then go back to #general.
        cy.get(".entrybox").type("/join #testing{enter}");
        cy.get(":nth-child(1) > .react-contextmenu-wrapper > .channel-button").click();

        cy.get(":nth-child(2) > .online-user").should("contain.text", "testuser").then(() => { // user list should be right.
            mockServer.fakeJoin(anotherUser, "#testing"); // have a user join while we aren't looking
        });

        // shouldn't be in this channel.
        cy.get(":nth-child(1) > .online-user").should("not.contain.text", "anotheruser");

        // but should be in #testing
        cy.get(":nth-child(2) > .react-contextmenu-wrapper > .channel-button").click();
        cy.get(":nth-child(1) > .online-user").should("contain.text", "anotheruser");
    });

    it("causes a user list update when user status changes", () => {
        cy.get(".user-list").should("contain.text", "testuser").then(() => {
            mockServer.fakeJoin(otherUser, "#general");
        });

        cy.get(":nth-child(1) > .online-user").should("contain.text", "otheruser").then(() => {
            otherUser.status = UserStatus.Offline;
            mockServer.fakeStatusUpdate(otherUser);
        });

        cy.get(":nth-child(2) > .offline-user").should("contain.text", "otheruser").then(() => {
            otherUser.status = UserStatus.Online;
            mockServer.fakeStatusUpdate(otherUser);
        });

        cy.get(":nth-child(1) > .online-user").should("contain.text", "otheruser");
        cy.get(".entrybox").type("/join #testing{enter}");
        cy.get(":nth-child(1) > .react-contextmenu-wrapper > .channel-button").click().then(() => {
            mockServer.fakeJoin(anotherUser, "#testing"); // have a user join while we aren't looking
            anotherUser.status = UserStatus.Offline;
            mockServer.fakeStatusUpdate(anotherUser);
        });

        cy.get(":nth-child(2) > .react-contextmenu-wrapper > .channel-button").click();
        cy.get(":nth-child(2) > .offline-user").should("contain.text", "anotheruser");
    });
});