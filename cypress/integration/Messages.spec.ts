/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* eslint jest/valid-expect-in-promise: 0 */

import { MockServer } from "../support/MockServer";
import { User, UserStatus, Channel } from "../../src/net/client";

describe("Messages", () => {
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

    let channels: Channel[] = [
        {
            address: "",
            id: 1,
            name: "#general",
            users: [testUser, otherUser]
        },
        {
            address: "",
            id: 2,
            name: "#testing",
            users: [testUser]
        },
        {
            address: "",
            id: 3,
            name: "#z",
            users: [testUser]
        }
    ];

    beforeEach(() => {
        mockServer?.stop();
        mockServer = new MockServer("ws://0.0.0.0:1337", channels, testUser);

        let messagesPacket;
        cy.fixture("messages").then(packet => {
            messagesPacket = packet;
            for (const k of Object.keys(messagesPacket)) {
                mockServer.setMessages(k, messagesPacket[k]);
            }
        });

        mockServer.start();

        cy.mockSockets();
        cy.stubNotifications();
        cy.visit("/").then(() => cy.login("ws://0.0.0.0:1337", "testuser", "test"));
    });

    it("can be received", () => {
        cy.get(":nth-child(43)").then(() => {
            mockServer.sendMessage(otherUser, "#general", "hello");
        }).get(":nth-child(44) > .message-content").should("contain.text", "otheruser: hello");
        cy.get(":nth-child(44) > .message-time").should("exist");
    });

    it("can be received through history", () => {
        cy.get(":nth-child(39) > .message-content").should("contain.text", "test: testing");
        cy.get(":nth-child(39) > .message-time").should("be.visible");
        cy.get(".message-list").scrollTo("top");
        cy.get(":nth-child(2) > .message-content").should("be.visible");
        cy.get(":nth-child(2) > .message-content").should("contain.text", "otheruser: hello");
        cy.get(":nth-child(8) > .message-time").should("not.exist");
    });

    it("contain clickable links", () => {
        cy.get(":nth-child(35) > .message-content > a").should("exist");
    });

    it("can be sent", () => {
        cy.get(".entrybox").type("hello world{enter}");
        cy.get(":nth-child(44) > .message-content").should("contain.text", "testuser: hello world");
        cy.get(":nth-child(44) > .message-time").should("exist");
    });

    it("update the server tree", () => {
        cy.get(":nth-child(1) > .react-contextmenu-wrapper > .channel-button")
            .should("not.have.class", "channel-button-unread");
        cy.get(":nth-child(2) > .react-contextmenu-wrapper > .channel-button")
            .should("have.class", "channel-button-unread")
            .click()
            .should("not.have.class", "channel-button-unread")
            .then(() => {
                mockServer.sendMessage(otherUser, "#general", "test...");
            })
            .should("not.have.class", "channel-button-unread")
            .then(() => {
                mockServer.sendMessage(otherUser, "#testing", "hello");
            })
            .should("not.have.class", "channel-button-unread");

        cy.get(":nth-child(1) > .react-contextmenu-wrapper > .channel-button")
            .should("have.class", "channel-button-unread");

        cy.get("[data-cy=test]").click();

        cy.get(":nth-child(1) > .react-contextmenu-wrapper > .channel-button")
            .should("have.class", "channel-button-unread")
            .click()
            .should("not.have.class", "channel-button-unread");

        cy.get(":nth-child(2) > .react-contextmenu-wrapper > .channel-button")
            .should("not.have.class", "channel-button-unread");
    });

    it("containing ping words update the server tree", () => {
        cy.get(":nth-child(2) > .react-contextmenu-wrapper > .channel-button")
            .should("not.have.class", "channel-button-ping")
            .then(() => {
                mockServer.sendMessage(otherUser, "#testing", "@testuser ping");
            });
        cy.get(":nth-child(2) > .react-contextmenu-wrapper > .channel-button")
            .should("have.class", "channel-button-ping")
            .click()
            .should("not.have.class", "channel-button-ping")
            .should("not.have.class", "channel-button-unread");
        cy.get(":nth-child(3) > .react-contextmenu-wrapper > .channel-button")
            .should("have.class", "channel-button-ping")
            .click()
            .should("not.have.class", "channel-button-ping")
            .should("not.have.class", "channel-button-unread");
        cy.get(":nth-child(2) > .message-content").should("have.class", "message-content-pinged");
    });

    /*
    // These don't work quite yet.
    it("trigger notifications when the window is blurred", () => {
        cy.get(":nth-child(43)").then(() => {
            sendMessage(otherUser, "#general", "hello");
        });
        cy.get(".entrybox").type("hello world{enter}");
        cy.get("@Notification").should("have.been.calledOnce");
    });

    it("does not trigger notifications when the window is focused", () => {
        cy.window().trigger("focus");
        cy.get(":nth-child(43)").then(() => {
            sendMessage(otherUser, "#general", "hello");
        });
        cy.get(".entrybox").type("hello world{enter}");
        cy.get("@Notification").should("not.have.been.called");
    });*/
});