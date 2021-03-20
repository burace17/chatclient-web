/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Server } from "mock-socket";
import { User, UserStatus } from "../../src/net/client";

describe("Messages", () => {
    let mockServer: Server = undefined;
    let socket: WebSocket = undefined;
    const sendMessage = (user: User, channel: string, content: string) => {
        const packet = {
            "cmd": "MSG",
            "user": user,
            "channel": channel,
            "message_id": Math.floor(Math.random() * 1000),
            "time": Math.floor(Date.now() / 1000),
            "content": content
        };
        socket?.send(JSON.stringify(packet));
    };

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

    beforeEach(() => {
        let welcomePacket;
        cy.fixture("serverData").then(packet => {
            welcomePacket = packet;
        });

        let messagesPacket;
        cy.fixture("messages").then(packet => {
            messagesPacket = packet;
        });

        mockServer?.close();
        mockServer = new Server("ws://0.0.0.0:1337");
        mockServer.on("connection", sock => {
            socket = sock;
            sock.send(JSON.stringify(welcomePacket));
            sock.on("message", (msgStr: string) => {
                const msg = JSON.parse(msgStr);
                if (msg.cmd === "HISTORY")
                    sock.send(JSON.stringify(messagesPacket));
                else if (msg.cmd === "MSG")
                    sendMessage(testUser, msg.channel, msg.content);
            });
        });
        mockServer.start();

        cy.mockSockets();
        cy.stubNotifications();
        cy.visit("/").then(() => cy.login("ws://0.0.0.0:1337", "testuser", "test"));
    });

    it("can be received", () => {
        cy.get(":nth-child(43)").then(() => {
            sendMessage(otherUser, "#general", "hello");
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