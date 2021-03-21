/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Server } from "mock-socket";
import { User, Channel, ClientMessage } from "../../src/net/client";

export interface MessagesHolder {
    last_read_message: number;
    messages: ClientMessage[];
}

// A very simple mock of the server. Only supports one client.
export class MockServer {
    private server: Server;
    private socket: WebSocket | null = null;
    private user: User;
    private channels: Channel[];
    private messages = new Map<string, MessagesHolder>();
    private viewedChannel: Channel | null = null;

    constructor(address: string, channels: Channel[], user: User) {
        for (const c of channels) {
            this.messages.set(c.name, { last_read_message: null, messages: [] });
        }

        this.channels = channels;
        this.user = user;
        this.server = new Server(address);
        this.server.on("connection", sock => {
            if (this.socket)
                throw Error("MockServer: Already have a socket stored. Currently we only support one connection");
            this.socket = sock;

            const welcomePkt = {
                cmd: "WELCOME",
                name: "test",
                channels: this.channels,
                viewing: []
            };
            sock.send(JSON.stringify(welcomePkt));
            sock.on("message", this.onSocketMessage);
        });
    }

    private onSocketMessage = (msgStr: string) => {
        const message = JSON.parse(msgStr);
        if (message.cmd === "HISTORY")
            this.sendHistory();
        else if (message.cmd === "MSG") {
            this.sendMessage(this.user, message.channel, message.content);
        }
        else if (message.cmd === "VIEWING") {
            this.notifyNotViewingChannels();
            const packet = {
                cmd: "HASVIEWERS",
                channel: message.channel
            };

            this.viewedChannel = this.channels.find(c => c.name === message.channel) ?? null;
            this.socket.send(JSON.stringify(packet));
        }
        else if (message.cmd === "NOTVIEWING") {
            this.notifyNotViewingChannels();
        }
        else if (message.cmd === "JOIN") {
            if (!this.messages.has(message.name)) {
                this.messages.set(message.name, { last_read_message: null, messages: [] });
                const nextId = Math.max(...this.channels.map(c => c.id)) + 1;
                this.channels.push({
                    address: "",
                    id: nextId,
                    name: message.name,
                    users: [this.user]
                });
            }

            const channel = this.channels.find(c => c.name === message.name);
            const channelInfoPacket = {
                cmd: "CHANNELINFO",
                channel
            };
            this.socket.send(JSON.stringify(channelInfoPacket));
        }
    };

    setMessages = (channel: string, messagesHolder: MessagesHolder) => {
        messagesHolder.messages = messagesHolder.messages.reverse();
        this.messages.set(channel, messagesHolder);
    };

    start = () => {
        this.server.start();
    };

    stop = () => {
        this.server.stop();
    };

    sendMessage = (user: User, channel: string, content: string) => {
        const messageHolder = this.messages.get(channel);
        const message_id = messageHolder.messages[messageHolder.messages.length - 1].message_id + 1;
        const time = Math.floor(Date.now() / 1000);
        const packet = {
            cmd: "MSG",
            user: user,
            channel: channel,
            message_id,
            time,
            content: content
        };

        const clientMessage: ClientMessage = {
            message_id,
            content,
            user,
            nickname: user.nickname,
            time
        };
        messageHolder.messages.push(clientMessage);
        this.socket?.send(JSON.stringify(packet));
    };

    fakeJoin = (user: User, channel: string) => {
        const packet = {
            cmd: "JOIN",
            channel,
            user
        };
        this.socket?.send(JSON.stringify(packet));
    };

    fakeStatusUpdate = (user: User) => {
        const packet = {
            cmd: "STATUS",
            user
        };
        this.socket?.send(JSON.stringify(packet));
    };

    private sendHistory = () => {
        let messages = {};
        for (const [channelName, messageHolder] of this.messages) {
            messages[channelName] = messageHolder;
        }

        let historyPkt = {
            cmd: "HISTORY",
            messages
        };

        this.socket?.send(JSON.stringify(historyPkt));
    };

    private notifyNotViewingChannels = () => {
        if (this.viewedChannel && this.socket) {
            const messagesHolder = this.messages.get(this.viewedChannel.name);
            const lastMessageId = messagesHolder.messages[messagesHolder.messages.length - 1]?.message_id ?? null;
            const noViewers = {
                cmd: "NOVIEWERS",
                channel: this.viewedChannel.name,
                message_id: lastMessageId
            };
            this.viewedChannel = null;
            this.socket.send(JSON.stringify(noViewers));
        }
    };
}